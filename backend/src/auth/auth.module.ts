import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1d' },
    }),
    MailModule, // ✅ Mail service module
  ],
  controllers: [AuthController], // ✅ Add controller
  providers: [AuthService, PrismaService], // ✅ Add AuthService & PrismaService
})
export class AuthModule {}
