import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';

import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;

  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const category: Category = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Frutas',
    description: 'Frutas frescas disponibles',
  };

  const createDto = {
    name: category.name,
    description: category.description,
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    service = new CategoriesService(
      repository as unknown as Repository<Category>,
    );
  });

  it('lists categories', async () => {
    repository.find.mockResolvedValue([category]);

    await expect(service.findAll()).resolves.toEqual([category]);

    expect(repository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('finds a category by UUID', async () => {
    repository.findOne.mockResolvedValue(category);

    await expect(service.findOne(category.id)).resolves.toEqual(category);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: category.id },
    });
  });

  it('returns 404 when a category does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(category.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a category using the repository', async () => {
    repository.create.mockReturnValue(category);
    repository.save.mockResolvedValue(category);

    await expect(service.create(createDto)).resolves.toEqual(category);

    expect(repository.create).toHaveBeenCalledWith(createDto);

    expect(repository.save).toHaveBeenCalledWith(category);
  });

  it('updates an existing category', async () => {
    repository.findOne.mockResolvedValue({
      ...category,
    });

    repository.save.mockImplementation(async (value) => value);

    const result = await service.update(category.id, {
      name: 'Verduras',
    });

    expect(result.name).toBe('Verduras');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('removes an existing category', async () => {
    repository.findOne.mockResolvedValue(category);
    repository.remove.mockResolvedValue(category);

    await service.remove(category.id);

    expect(repository.remove).toHaveBeenCalledWith(category);
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

  it('rejects names exceeding entity limits', async () => {
    await expect(
      service.create({
        ...createDto,
        name: 'A'.repeat(121),
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('maps database constraint errors to 409', async () => {
    repository.create.mockReturnValue(category);

    const databaseError = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('Database constraint violation'), {
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
