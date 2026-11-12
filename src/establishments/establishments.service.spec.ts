import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';

import { EstablishmentsService } from './establishments.service';
import { Establishment } from './entities/establishment.entity';

describe('EstablishmentsService', () => {
  let service: EstablishmentsService;

  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const establishment: Establishment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Restaurante Central',
    type: 'Restaurant',
    address: 'Calle 10',
    phone: '3001234567',
    email: 'central@example.com',
  };

  const createDto = {
    name: establishment.name,
    type: establishment.type,
    address: establishment.address,
    phone: establishment.phone,
    email: establishment.email,
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    service = new EstablishmentsService(
      repository as unknown as Repository<Establishment>,
    );
  });

  it('lists establishments', async () => {
    repository.find.mockResolvedValue([establishment]);

    await expect(service.findAll()).resolves.toEqual([establishment]);

    expect(repository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('finds an establishment by UUID', async () => {
    repository.findOne.mockResolvedValue(establishment);

    await expect(service.findOne(establishment.id)).resolves.toEqual(
      establishment,
    );

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: establishment.id },
    });
  });

  it('returns 404 when an establishment does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(establishment.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates an establishment using the repository', async () => {
    repository.create.mockReturnValue(establishment);
    repository.save.mockResolvedValue(establishment);

    await expect(service.create(createDto)).resolves.toEqual(establishment);

    expect(repository.create).toHaveBeenCalledWith(createDto);
    expect(repository.save).toHaveBeenCalledWith(establishment);
  });

  it('updates an existing establishment', async () => {
    repository.findOne.mockResolvedValue({
      ...establishment,
    });

    repository.save.mockImplementation(async (value) => value);

    const result = await service.update(establishment.id, {
      name: 'Restaurante Actualizado',
    });

    expect(result.name).toBe('Restaurante Actualizado');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('removes an existing establishment', async () => {
    repository.findOne.mockResolvedValue(establishment);
    repository.remove.mockResolvedValue(establishment);

    await service.remove(establishment.id);

    expect(repository.remove).toHaveBeenCalledWith(establishment);
  });

  it('rejects missing required fields', async () => {
    await expect(
      service.create({
        ...createDto,
        name: '',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects values exceeding entity limits', async () => {
    await expect(
      service.create({
        ...createDto,
        name: 'A'.repeat(151),
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('maps database constraint errors to 409', async () => {
    repository.create.mockReturnValue(establishment);

    const databaseError = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('Foreign key constraint violation'), {
        code: '23503',
      }),
    );

    repository.save.mockRejectedValue(databaseError);

    await expect(service.create(createDto)).rejects.toThrow(ConflictException);
  });

  it('maps unexpected database errors to 500', async () => {
    repository.find.mockRejectedValue(new Error('Connection unavailable'));

    await expect(service.findAll()).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
