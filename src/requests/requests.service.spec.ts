import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FoodPublication } from '../food-publications/entities/food-publication.entity';
import { Request } from './entities/request.entity';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '550e8400-e29b-41d4-a716-446655440001';
  const foodPublicationId = '550e8400-e29b-41d4-a716-446655440002';
  const dto = { userId, foodPublicationId, quantity: 1.5 };
  const row: Request = {
    ...dto,
    id,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const requests = {
    find: jest.fn<Repository<Request>['find']>(),
    findOne: jest.fn<Repository<Request>['findOne']>(),
    create: jest.fn<(value: Partial<Request>) => Request>(),
    save: jest.fn<(value: Request) => Promise<Request>>(),
    remove: jest.fn<(value: Request) => Promise<Request>>(),
  };
  const users = { exists: jest.fn<Repository<User>['exists']>() };
  const publications = {
    exists: jest.fn<Repository<FoodPublication>['exists']>(),
  };
  let service: RequestsService;

  beforeEach(() => {
    jest.resetAllMocks();
    requests.find.mockResolvedValue([row]);
    requests.findOne.mockImplementation(async () => ({ ...row }));
    requests.create.mockImplementation((value) => ({ ...row, ...value }));
    requests.save.mockImplementation(async (value) => value);
    requests.remove.mockResolvedValue(row);
    users.exists.mockResolvedValue(true);
    publications.exists.mockResolvedValue(true);
    service = new RequestsService(
      requests as unknown as Repository<Request>,
      users as unknown as Repository<User>,
      publications as unknown as Repository<FoodPublication>,
    );
  });

  it('lists and finds requests without loading user relations', async () => {
    await expect(service.findAll()).resolves.toEqual([row]);
    await expect(service.findOne(id)).resolves.toEqual(row);
    expect(requests.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(requests.findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it('creates pending requests with existing references and decimal quantity', async () => {
    await expect(service.create(dto)).resolves.toEqual(row);
    expect(users.exists).toHaveBeenCalledWith({ where: { id: userId } });
    expect(publications.exists).toHaveBeenCalledWith({
      where: { id: foodPublicationId },
    });
    expect(requests.create).toHaveBeenCalledWith({ ...dto, status: 'pending' });
  });

  it('updates quantity and removes an existing request', async () => {
    await expect(service.update(id, { quantity: 3 })).resolves.toMatchObject({
      quantity: 3,
    });
    await expect(service.remove(id)).resolves.toBeUndefined();
    expect(requests.remove).toHaveBeenCalledWith(row);
  });

  it('accepts and rejects with matching DTO statuses', async () => {
    await expect(
      service.accept(id, { status: 'accepted' }),
    ).resolves.toMatchObject({ status: 'accepted' });
    await expect(
      service.reject(id, { status: 'rejected' }),
    ).resolves.toMatchObject({ status: 'rejected' });
    await expect(service.accept(id, { status: 'rejected' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.reject(id, { status: 'pending' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it.each([
    null,
    [],
    {},
    { ...dto, quantity: 0 },
    { ...dto, quantity: -1 },
    { ...dto, quantity: NaN },
    { ...dto, quantity: Infinity },
    { ...dto, quantity: '2' },
    { ...dto, userId: 'invalid' },
    { ...dto, foodPublicationId: 'invalid' },
    { ...dto, status: 'accepted' },
    { ...dto, password: 'secret' },
  ])('rejects invalid create data: %p', async (input) => {
    await expect(service.create(input as never)).rejects.toThrow(
      BadRequestException,
    );
    expect(requests.save).not.toHaveBeenCalled();
  });

  it('rejects malformed identifiers and update bodies', async () => {
    await expect(service.findOne('bad')).rejects.toThrow(BadRequestException);
    await expect(
      service.update(id, { quantity: null } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(service.update(id, { userId } as never)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.accept(id, null as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns 404 for absent requests in all operations', async () => {
    requests.findOne.mockResolvedValue(null);
    for (const operation of [
      () => service.findOne(id),
      () => service.update(id, { quantity: 2 }),
      () => service.remove(id),
      () => service.accept(id, { status: 'accepted' }),
      () => service.reject(id, { status: 'rejected' }),
    ]) {
      await expect(operation()).rejects.toThrow(NotFoundException);
    }
    expect(requests.save).not.toHaveBeenCalled();
  });

  it('returns 404 for absent references during create and update', async () => {
    users.exists.mockResolvedValue(false);
    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    users.exists.mockResolvedValue(true);
    publications.exists.mockResolvedValue(false);
    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    await expect(service.update(id, { quantity: 2 })).rejects.toThrow(
      NotFoundException,
    );
    expect(requests.save).not.toHaveBeenCalled();
  });

  it.each(['23505', '23503', '23514', '23502'])(
    'maps integrity error %s to 409',
    async (code) => {
      requests.save.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('private detail'), { code }),
        ),
      );
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    },
  );

  it('maps invalid database data to 400 and unexpected failures to 500', async () => {
    requests.find.mockRejectedValue(
      new QueryFailedError(
        'SELECT',
        [],
        Object.assign(new Error(), { code: '22P02' }),
      ),
    );
    await expect(service.findAll()).rejects.toThrow(BadRequestException);
    requests.find.mockRejectedValue(new Error('offline'));
    await expect(service.findAll()).rejects.toThrow(
      InternalServerErrorException,
    );
    requests.findOne.mockRejectedValue(new Error('offline'));
    await expect(service.findOne(id)).rejects.toThrow(
      InternalServerErrorException,
    );
    users.exists.mockRejectedValue(new Error('offline'));
    await expect(service.create(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('maps failed writes and deletes to 500', async () => {
    requests.save.mockRejectedValue(new Error('offline'));
    requests.remove.mockRejectedValue(new Error('offline'));
    for (const operation of [
      () => service.create(dto),
      () => service.update(id, {}),
      () => service.accept(id, { status: 'accepted' }),
      () => service.reject(id, { status: 'rejected' }),
      () => service.remove(id),
    ]) {
      await expect(operation()).rejects.toThrow(InternalServerErrorException);
    }
  });
});
