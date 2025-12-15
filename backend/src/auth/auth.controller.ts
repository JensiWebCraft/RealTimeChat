import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  // ✅ Inject AuthService in constructor
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    return this.authService.register(body.username, body.email, body.password);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('login')
  login(@Body() body: { identifier: string; password: string }) {
    return this.authService.login(body.identifier, body.password);
  }

  @Post('resend-otp')
  resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }
}
