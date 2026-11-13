import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary:
      'Usuario registrado; user.id, user.name y user.email. Sin password.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado; user.id, user.name y user.email. Sin password.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Credenciales verificadas; mismo user.id. Sin password ni token.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Credenciales verificadas; mismo user.id. Sin password ni token.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  getProfile() {
    // Pending: requires token authentication (JWT + guard) to know who is asking.
    throw new NotImplementedException(
      'Profile requires authentication, which is not implemented yet',
    );
  }
}
