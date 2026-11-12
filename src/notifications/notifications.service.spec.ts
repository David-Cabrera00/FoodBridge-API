import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '550e8400-e29b-41d4-a716-446655440001';
  const row: Notification = {
    id,
    userId,
    title: 'Solicitud',
    message: 'Actualizada',
    isRead: false,
    createdAt: new Date(),
  };
  const notifications = {
    find: jest.fn<Repository<Notification>['find']>(),
    findOne: jest.fn<Repository<Notification>['findOne']>(),
    save: jest.fn<(value: Notification) => Promise<Notification>>(),
  };
  const users = { exists: jest.fn<Repository<User>['exists']>() };
  let service: NotificationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    notifications.find.mockResolvedValue([row]);
    notifications.findOne.mockImplementation(async () => ({ ...row }));
    notifications.save.mockImplementation(async (value) => value);
    users.exists.mockResolvedValue(true);
    service = new NotificationsService(
      notifications as unknown as Repository<Notification>,
      users as unknown as Repository<User>,
    );
  });

  it('lists and finds only notifications belonging to the specified user', async () => {
    await expect(service.findAll(userId)).resolves.toEqual([row]);
    await expect(service.findOne(userId, id)).resolves.toEqual(row);
    expect(notifications.find).toHaveBeenCalledWith({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    expect(notifications.findOne).toHaveBeenCalledWith({
      where: { id, userId },
    });
    expect(users.exists).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it('marks notifications read and supports false according to the DTO', async () => {
    await expect(
      service.markRead(userId, id, { isRead: true }),
    ).resolves.toMatchObject({ isRead: true });
    await expect(
      service.markRead(userId, id, { isRead: false }),
    ).resolves.toMatchObject({ isRead: false });
  });

  it('returns 404 for a notification absent from the user scope', async () => {
    notifications.findOne.mockResolvedValue(null);
    await expect(service.findOne(userId, id)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.markRead(userId, id, { isRead: true }),
    ).rejects.toThrow(NotFoundException);
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('returns 404 if the referenced user does not exist', async () => {
    users.exists.mockResolvedValue(false);
    await expect(service.findAll(userId)).rejects.toThrow(NotFoundException);
    await expect(service.findOne(userId, id)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.markRead(userId, id, { isRead: true }),
    ).rejects.toThrow(NotFoundException);
    expect(notifications.find).not.toHaveBeenCalled();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('rejects invalid UUIDs before querying notifications', async () => {
    await expect(service.findAll('bad')).rejects.toThrow(BadRequestException);
    await expect(service.findOne(userId, 'bad')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.markRead('bad', id, { isRead: true })).rejects.toThrow(
      BadRequestException,
    );
    expect(notifications.findOne).not.toHaveBeenCalled();
  });

  it.each([
    null,
    [],
    {},
    { isRead: 'true' },
    { isRead: 1 },
    { isRead: null },
    { isRead: true, userId },
    { isRead: true, title: 'changed' },
  ])('rejects invalid mark-read data: %p', async (dto) => {
    await expect(service.markRead(userId, id, dto as never)).rejects.toThrow(
      BadRequestException,
    );
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('maps conflicts to 409 and unexpected persistence failures to 500', async () => {
    notifications.save.mockRejectedValue(
      new QueryFailedError(
        'UPDATE',
        [],
        Object.assign(new Error(), { code: '23503' }),
      ),
    );
    await expect(
      service.markRead(userId, id, { isRead: true }),
    ).rejects.toThrow(ConflictException);
    notifications.save.mockRejectedValue(new Error('offline'));
    await expect(
      service.markRead(userId, id, { isRead: true }),
    ).rejects.toThrow(InternalServerErrorException);
    notifications.find.mockRejectedValue(new Error('offline'));
    await expect(service.findAll(userId)).rejects.toThrow(
      InternalServerErrorException,
    );
    notifications.findOne.mockRejectedValue(new Error('offline'));
    await expect(service.findOne(userId, id)).rejects.toThrow(
      InternalServerErrorException,
    );
    users.exists.mockRejectedValue(new Error('offline'));
    await expect(service.findAll(userId)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
