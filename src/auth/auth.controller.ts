import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return {
      message: 'User registered',
      data: registerDto,
    };
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return {
      message: 'User logged in',
      data: loginDto,
    };
  }

  @Get('profile')
  getProfile() {
    return {
      message: 'User profile',
    };
  }
}