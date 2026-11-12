import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    try {
      return await this.categoriesRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findOne(id: string): Promise<Category> {
    let category: Category | null;

    try {
      category = await this.categoriesRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    this.validateFields(dto, true);

    try {
      const category = this.categoriesRepository.create({
        name: dto.name.trim(),
        description: dto.description.trim(),
      });

      return await this.categoriesRepository.save(category);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    this.validateFields(dto, false);

    const category = await this.findOne(id);

    try {
      if (dto.name !== undefined) {
        category.name = dto.name.trim();
      }

      if (dto.description !== undefined) {
        category.description = dto.description.trim();
      }

      return await this.categoriesRepository.save(category);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    try {
      await this.categoriesRepository.remove(category);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private validateFields(
    dto: CreateCategoryDto | UpdateCategoryDto,
    required: boolean,
  ): void {
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new BadRequestException('Invalid category data');
    }

    const fields = {
      name: 120,
      description: null,
    } as const;

    const data = dto as Record<string, unknown>;

    for (const [field, maxLength] of Object.entries(fields)) {
      const value = data[field];

      if (value === undefined) {
        if (required) {
          throw new BadRequestException(`${field} is required`);
        }
        continue;
      }

      if (
        typeof value !== 'string' ||
        value.trim().length === 0 ||
        (maxLength !== null && value.trim().length > maxLength)
      ) {
        throw new BadRequestException(`Invalid ${field}`);
      }
    }
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string } | undefined)?.code;

      if (code === '22P02') {
        throw new BadRequestException('Invalid identifier format');
      }

      if (code === '23505' || code === '23503') {
        throw new ConflictException('Database constraint violation');
      }

      if (code === '23502' || code === '22001') {
        throw new BadRequestException('Invalid category data');
      }
    }

    throw new InternalServerErrorException('Unexpected database error');
  }
}
