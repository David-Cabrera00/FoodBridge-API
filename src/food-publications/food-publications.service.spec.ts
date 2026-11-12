import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { QueryFailedError, Repository } from 'typeorm';

import { Category } from '../categories/entities/category.entity';
import { Establishment } from '../establishments/entities/establishment.entity';
import { FoodPublication } from './entities/food-publication.entity';
import { FoodPublicationsService } from './food-publications.service';

describe('FoodPublicationsService', () => {
  let service: FoodPublicationsService;
  let publications: Record<string, jest.Mock>;
  let establishments: Record<string, jest.Mock>;
  let categories: Record<string, jest.Mock>;

  const establishmentId = '550e8400-e29b-41d4-a716-446655440000';
  const categoryId = '550e8400-e29b-41d4-a716-446655440001';
  const publication: FoodPublication = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    establishmentId,
    categoryId,
    title: 'Canastas de frutas',
    description: 'Frutas frescas',
    quantity: 2,
    unit: 'canastas',
    expirationDate: new Date('2026-12-01T12:00:00.000Z'),
    status: 'available',
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
  };

  beforeEach(() => {
    publications = {
      find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn(),
    };
    establishments = { findOne: jest.fn().mockResolvedValue({ id: establishmentId }) };
    categories = { findOne: jest.fn().mockResolvedValue({ id: categoryId }) };

    service = new FoodPublicationsService(
      publications as unknown as Repository<FoodPublication>,
      establishments as unknown as Repository<Establishment>,
      categories as unknown as Repository<Category>,
    );
  });

  it('lists publications ordered by creation date', async () => {
    publications.find.mockResolvedValue([publication]);
    await expect(service.findAll()).resolves.toEqual([publication]);
    expect(publications.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });

  it('finds a publication and returns 404 when absent', async () => {
    publications.findOne.mockResolvedValue(publication);
    await expect(service.findOne(publication.id)).resolves.toEqual(publication);

    publications.findOne.mockResolvedValue(null);
    await expect(service.findOne(publication.id)).rejects.toThrow(NotFoundException);
  });

  it('creates a publication after validating its references and date', async () => {
    publications.create.mockImplementation((value) => value);
    publications.save.mockResolvedValue(publication);

    await expect(service.create({
      establishmentId,
      categoryId,
      title: ' Canastas de frutas ',
      description: 'Frutas frescas',
      quantity: 2,
      unit: 'canastas',
      expirationDate: '2026-12-01T12:00:00.000Z',
    })).resolves.toEqual(publication);

    expect(establishments.findOne).toHaveBeenCalledWith({ where: { id: establishmentId } });
    expect(categories.findOne).toHaveBeenCalledWith({ where: { id: categoryId } });
    expect(publications.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Canastas de frutas',
      expirationDate: new Date('2026-12-01T12:00:00.000Z'),
    }));
  });

  it('updates without changing establishmentId', async () => {
    const current = { ...publication };
    publications.findOne.mockResolvedValue(current);
    publications.save.mockImplementation(async (value) => value);

    const result = await service.update(publication.id, { categoryId, title: 'Actualizada' });

    expect(result.title).toBe('Actualizada');
    expect(result.establishmentId).toBe(establishmentId);
    expect(publications.save).toHaveBeenCalledWith(current);
  });

  it('removes an existing publication', async () => {
    publications.findOne.mockResolvedValue(publication);
    publications.remove.mockResolvedValue(publication);
    await expect(service.remove(publication.id)).resolves.toBeUndefined();
    expect(publications.remove).toHaveBeenCalledWith(publication);
  });

  it('rejects malformed body UUIDs and dates', async () => {
    await expect(service.create({
      establishmentId: 'not-a-uuid', categoryId, title: 'x', unit: 'u',
    } as never)).rejects.toThrow(BadRequestException);

    await expect(service.create({
      establishmentId, categoryId, title: 'x', unit: 'u', expirationDate: 'invalid',
    } as never)).rejects.toThrow(BadRequestException);
    expect(publications.save).not.toHaveBeenCalled();
  });

  it('returns 404 when a referenced establishment or category is absent', async () => {
    establishments.findOne.mockResolvedValue(null);
    await expect(service.create({ establishmentId, categoryId, title: 'x', unit: 'u' } as never))
      .rejects.toThrow(NotFoundException);

    establishments.findOne.mockResolvedValue({ id: establishmentId });
    categories.findOne.mockResolvedValue(null);
    await expect(service.create({ establishmentId, categoryId, title: 'x', unit: 'u' } as never))
      .rejects.toThrow(NotFoundException);
  });

  it('maps persistence errors to HTTP exceptions', async () => {
    publications.find.mockRejectedValue(new Error('database unavailable'));
    await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);

    publications.create.mockReturnValue(publication);
    publications.save.mockRejectedValue(new QueryFailedError(
      'INSERT', [], Object.assign(new Error('constraint'), { code: '23503' }),
    ));
    await expect(service.create({ establishmentId, categoryId, title: 'x', unit: 'u' } as never))
      .rejects.toThrow(ConflictException);
  });
});
