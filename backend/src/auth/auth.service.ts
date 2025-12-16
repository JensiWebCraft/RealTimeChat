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
    private readonly mailService: MailService,
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
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        isVerified: false,
      },
    });

    try {
      await this.mailService.sendOtp(email, otp);
      return { message: 'Registration successful. OTP sent to your email.' };
    } catch (error) {
      console.error('OTP sending failed, but user remains in DB:', error);
      // IMPORTANT: Do NOT delete the user here!
      // User stays so verification can still work (use OTP from logs in debug mode)
      return {
        message:
          'Registration successful. OTP email failed, but check Render logs for OTP (debug mode). You can resend OTP.',
      };
    }
  }

  // 🔹 VERIFY OTP (unchanged - it's correct)
  async verifyOtp(email: string, otp: string) {
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }
    email = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('OTP is invalid or already used');
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
    }

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

  // 🔹 LOGIN (unchanged - correct)
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

  // 🔹 RESEND OTP (unchanged - already good, no user deletion)
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
      throw new BadRequestException(
        'Failed to send OTP email. Please try resend OTP.',
      );
    }

    return { message: 'New OTP sent to your email' };
  }
}
