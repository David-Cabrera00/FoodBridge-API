import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { hashPassword } from '../users/password.util';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const users = { create: jest.fn(), findByEmailWithPassword: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: users }],
    }).compile();
    service = module.get(AuthService);
  });

  it('register returns the public user only', async () => {
    users.create.mockResolvedValue({
      id: 'u1',
      name: 'Ana',
      email: 'a@a.com',
      password: 'should-not-leak',
    });
    const res = await service.register({
      name: 'Ana',
      email: 'a@a.com',
      password: 'secret123',
    });
    expect(res.user).toEqual({ id: 'u1', name: 'Ana', email: 'a@a.com' });
    expect(JSON.stringify(res)).not.toContain('should-not-leak');
  });

  it('register propagates duplicate email conflict', async () => {
    users.create.mockRejectedValue(new ConflictException());
    await expect(
      service.register({ name: 'A', email: 'a@a.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login succeeds with correct credentials', async () => {
    users.findByEmailWithPassword.mockResolvedValue({
      id: 'u1',
      name: 'Ana',
      email: 'a@a.com',
      password: await hashPassword('secret123'),
    });
    const res = await service.login({
      email: 'a@a.com',
      password: 'secret123',
    });
    expect(res.user?.id).toBe('u1');
    expect(JSON.stringify(res)).not.toContain('scrypt');
  });

  it('login fails with wrong password', async () => {
    users.findByEmailWithPassword.mockResolvedValue({
      id: 'u1',
      password: await hashPassword('secret123'),
    });
    await expect(
      service.login({ email: 'a@a.com', password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login fails with unknown email (same error)', async () => {
    users.findByEmailWithPassword.mockResolvedValue(null);
    await expect(
      service.login({ email: 'no@a.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login rejects missing fields with 400', async () => {
    await expect(
      service.login({ email: '', password: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
