import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { QueryFailedError, Repository } from 'typeorm';
import { Request } from '../requests/entities/request.entity';
import { Pickup } from './entities/pickup.entity';
import { PickupsService } from './pickups.service';

describe('PickupsService', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const requestId = '550e8400-e29b-41d4-a716-446655440001';
  const dto = { requestId, scheduledAt: '2026-12-01T12:00:00Z' };
  const row: Pickup = {
    id,
    requestId,
    scheduledAt: new Date(dto.scheduledAt),
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const pickups = {
    find: jest.fn<Repository<Pickup>['find']>(),
    findOne: jest.fn<Repository<Pickup>['findOne']>(),
    create: jest.fn<(value: Partial<Pickup>) => Pickup>(),
    save: jest.fn<(value: Pickup) => Promise<Pickup>>(),
  };
  const requests = { exists: jest.fn<Repository<Request>['exists']>() };
  let service: PickupsService;

  beforeEach(() => {
    jest.resetAllMocks();
    pickups.find.mockResolvedValue([row]);
    pickups.findOne.mockImplementation(async () => ({ ...row }));
    pickups.create.mockImplementation((value) => ({ ...row, ...value }));
    pickups.save.mockImplementation(async (value) => value);
    requests.exists.mockResolvedValue(true);
    service = new PickupsService(
      pickups as unknown as Repository<Pickup>,
      requests as unknown as Repository<Request>,
    );
  });

  it('lists, finds and creates pickups with the existing request', async () => {
    await expect(service.findAll()).resolves.toEqual([row]);
    await expect(service.findOne(id)).resolves.toEqual(row);
    await expect(service.create(dto)).resolves.toEqual(row);
    expect(requests.exists).toHaveBeenCalledWith({ where: { id: requestId } });
    expect(pickups.create).toHaveBeenCalledWith({
      requestId,
      scheduledAt: new Date(dto.scheduledAt),
      status: 'scheduled',
    });
  });

  it('updates supported fields and preserves requestId', async () => {
    const scheduledAt = '2028-02-29T10:30:00-05:00';
    await expect(
      service.update(id, { scheduledAt, status: 'completed' }),
    ).resolves.toMatchObject({
      requestId,
      scheduledAt: new Date(scheduledAt),
      status: 'completed',
    });
    await expect(
      service.update(id, { status: 'cancelled' }),
    ).resolves.toMatchObject({ status: 'cancelled' });
  });

  it.each([
    'invalid',
    '',
    '2026-02-30T10:00:00Z',
    '2026-02-29T10:00:00Z',
    '2026-13-01T10:00:00Z',
    '2026-00-01T10:00:00Z',
    '2026-01-00T10:00:00Z',
    '2026-01-01T24:00:00Z',
    '2026-01-01T12:00:00',
    null,
    123,
  ])('rejects invalid dates: %p', async (scheduledAt) => {
    await expect(
      service.create({ ...dto, scheduledAt } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(service.update(id, { scheduledAt } as never)).rejects.toThrow(
      BadRequestException,
    );
    expect(pickups.save).not.toHaveBeenCalled();
  });

  it('rejects malformed identifiers, bodies, extra fields and statuses', async () => {
    await expect(service.findOne('bad')).rejects.toThrow(BadRequestException);
    await expect(service.create({ ...dto, requestId: 'bad' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.create(null as never)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.create({ ...dto, status: 'completed' } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(service.update(id, { requestId } as never)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.update(id, { status: 'unknown' } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(service.update(id, { status: null } as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns 404 for missing pickups and references', async () => {
    pickups.findOne.mockResolvedValue(null);
    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    await expect(service.update(id, {})).rejects.toThrow(NotFoundException);
    pickups.findOne.mockResolvedValue({ ...row });
    requests.exists.mockResolvedValue(false);
    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    await expect(service.update(id, {})).rejects.toThrow(NotFoundException);
    expect(pickups.save).not.toHaveBeenCalled();
  });

  it('does not impose uniqueness on requestId', async () => {
    await service.create(dto);
    await service.create(dto);
    expect(pickups.save).toHaveBeenCalledTimes(2);
  });

  it('maps integrity conflicts to 409', async () => {
    pickups.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error(), { code: '23503' }),
      ),
    );
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('maps unexpected reads, writes and reference failures to 500', async () => {
    pickups.find.mockRejectedValue(new Error('offline'));
    await expect(service.findAll()).rejects.toThrow(
      InternalServerErrorException,
    );
    pickups.save.mockRejectedValue(new Error('offline'));
    await expect(service.create(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.update(id, {})).rejects.toThrow(
      InternalServerErrorException,
    );
    pickups.findOne.mockRejectedValue(new Error('offline'));
    await expect(service.findOne(id)).rejects.toThrow(
      InternalServerErrorException,
    );
    requests.exists.mockRejectedValue(new Error('offline'));
    await expect(service.create(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
