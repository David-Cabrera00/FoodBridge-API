import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { hashPassword, verifyPassword } from '../users/password.util';
import { EMAIL_MAX, PASSWORD_MAX, assertValid } from '../users/users.validation';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response.interface';

// Valid hash used to equalize timing when the email does not exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () =>
  (dummyHash ??= hashPassword('dummy-password-for-timing'));

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // UsersService validates, rejects duplicate emails (409) and hashes.
    const user = await this.usersService.create({
      name: dto?.name,
      email: dto?.email,
      password: dto?.password,
    });
    return {
      message: 'User registered',
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const errors: string[] = [];
    if (
      typeof dto?.email !== 'string' ||
      dto.email.trim() === '' ||
      dto.email.length > EMAIL_MAX
    ) {
      errors.push('email is required');
    }
    // Upper bound avoids spending scrypt time on oversized input.
    if (
      typeof dto?.password !== 'string' ||
      dto.password === '' ||
      dto.password.length > PASSWORD_MAX
    ) {
      errors.push('password is required');
    }
    assertValid(errors);

    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const valid = await verifyPassword(
      dto.password,
      user?.password ?? (await getDummyHash()),
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // PENDING: issue a JWT here once token auth is agreed with the group.
    return {
      message: 'Credentials verified',
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
