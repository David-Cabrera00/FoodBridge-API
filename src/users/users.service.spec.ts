import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';

import { User } from './entities/user.entity';
import { verifyPassword } from './password.util';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn((x) => ({ ...x })),
    save: jest.fn((x) =>
      Promise.resolve({ id: 'uuid-1', createdAt: new Date(), ...x }),
    ),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  const dto = { name: ' Ana ', email: 'Ana@Mail.com', password: 'secret123' };

  it('create hashes the password, normalizes and never returns it', async () => {
    repo.exists.mockResolvedValue(false);
    const result = await service.create(dto);

    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('ana@mail.com');
    expect(result.name).toBe('Ana');
    const saved = repo.save.mock.calls[0][0];
    expect(saved.password).not.toBe('secret123');
    expect(await verifyPassword('secret123', saved.password)).toBe(true);
  });

  it('create rejects duplicate email with 409', async () => {
    repo.exists.mockResolvedValue(true);
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('create maps a unique violation race to 409', async () => {
    repo.exists.mockResolvedValue(false);
    repo.save.mockRejectedValueOnce(
      new QueryFailedError('insert', [], { code: '23505' } as any),
    );
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('create maps other DB errors to 500, not a permission error', async () => {
    repo.exists.mockResolvedValue(false);
    repo.save.mockRejectedValueOnce(new Error('boom'));
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('create rejects invalid input with 400', async () => {
    await expect(
      service.create({ name: '', email: 'bad', password: '123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findOne throws NotFound when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update throws NotFound when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update('x', { name: 'B' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update returns no password and hashes a new one', async () => {
    repo.findOne.mockResolvedValue({ id: 'u', name: 'A', email: 'a@a.com' });
    repo.exists.mockResolvedValue(false);
    const result = await service.update('u', {
      email: 'new@a.com',
      password: 'newpass123',
    });
    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('new@a.com');
    expect(repo.save.mock.calls[0][0].password).toMatch(/^scrypt\$/);
  });

  it('update rejects an email owned by another user', async () => {
    repo.findOne.mockResolvedValue({ id: 'u', name: 'A', email: 'a@a.com' });
    repo.exists.mockResolvedValue(true);
    await expect(
      service.update('u', { email: 'taken@a.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('remove throws NotFound when missing and removes when found', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.remove('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    repo.findOne.mockResolvedValueOnce({ id: 'u' });
    await service.remove('u');
    expect(repo.remove).toHaveBeenCalledWith({ id: 'u' });
  });
});
