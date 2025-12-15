import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Chat App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification OTP',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Email Verification</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP is valid for <b>10 minutes</b>.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }
}
