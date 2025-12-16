import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { generateOTP } from '../utils/otp.util';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService, // ✅ MailService injected
  ) {}

  // 🔹 REGISTER WITH OTP
  async register(username: string, email: string, password: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      if (!existingUser.isVerified) {
        throw new BadRequestException(
          'Account exists but not verified. Please verify your email.',
        );
      }
      throw new BadRequestException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        otp: hashedOtp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isVerified: false,
      },
    });

    try {
      await this.mailService.sendOtp(email, otp);
      return { message: 'Registration successful. OTP sent to your email.' };
    } catch (error) {
      console.error('OTP sending failed, but user is saved in DB:', error);
      // NO DELETE HERE – user stays so verify works
      return {
        message:
          'Registration successful. OTP email failed – check Render logs for OTP (debug mode). Resend OTP if needed.',
      };
    }
  }

  // 🔹 VERIFY OTP
  async verifyOtp(email: string, otp: string) {
    // ✅ Basic payload validation
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // ✅ Already verified → allow frontend to redirect
    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    // ✅ OTP missing (used / never generated)
    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('OTP is invalid or already used');
    }

    // ✅ OTP expired
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    // ✅ OTP check (hashed)
    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // ✅ Mark verified & clear OTP
    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  // 🔹 LOGIN
  async login(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign(
      { id: user.id, username: user.username, email: user.email },
      { expiresIn: '7d' },
    );

    return {
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email },
      token,
    };
  }

  // 🔹 RESEND OTP
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified)
      throw new BadRequestException('Email already verified');

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        otp: hashedOtp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await this.mailService.sendOtp(email, otp);
    } catch (error) {
      console.error('OTP email failed:', error);
      // ❌ DO NOT DELETE USER
      throw new BadRequestException(
        'Failed to send OTP email. Please try resend OTP.',
      );
    }

    return { message: 'New OTP sent to your email' };
  }
}
