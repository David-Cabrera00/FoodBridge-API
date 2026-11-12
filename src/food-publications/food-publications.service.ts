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

import { Category } from '../categories/entities/category.entity';
import { Establishment } from '../establishments/entities/establishment.entity';
import { CreateFoodPublicationDto } from './dto/create-food-publication.dto';
import { UpdateFoodPublicationDto } from './dto/update-food-publication.dto';
import { FoodPublication } from './entities/food-publication.entity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class FoodPublicationsService {
  constructor(
    @InjectRepository(FoodPublication)
    private readonly foodPublicationsRepository: Repository<FoodPublication>,
    @InjectRepository(Establishment)
    private readonly establishmentsRepository: Repository<Establishment>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<FoodPublication[]> {
    try {
      return await this.foodPublicationsRepository.find({
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findOne(id: string): Promise<FoodPublication> {
    let publication: FoodPublication | null;

    try {
      publication = await this.foodPublicationsRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }

    if (!publication) {
      throw new NotFoundException(`Food publication ${id} not found`);
    }

    return publication;
  }

  async create(dto: CreateFoodPublicationDto): Promise<FoodPublication> {
    this.validateDto(dto, true);
    const establishmentId = this.validateUuid(dto.establishmentId, 'establishmentId');
    const categoryId = this.validateUuid(dto.categoryId, 'categoryId');

    await this.ensureEstablishmentExists(establishmentId);
    await this.ensureCategoryExists(categoryId);

    try {
      const publication = this.foodPublicationsRepository.create({
        establishmentId,
        categoryId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        quantity: dto.quantity,
        unit: dto.unit.trim(),
        expirationDate: this.parseExpirationDate(dto.expirationDate),
      });

      return await this.foodPublicationsRepository.save(publication);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async update(
    id: string,
    dto: UpdateFoodPublicationDto,
  ): Promise<FoodPublication> {
    this.validateDto(dto, false);
    if (dto.categoryId !== undefined) {
      const categoryId = this.validateUuid(dto.categoryId, 'categoryId');
      await this.ensureCategoryExists(categoryId);
    }

    const publication = await this.findOne(id);

    try {
      if (dto.categoryId !== undefined) publication.categoryId = dto.categoryId;
      if (dto.title !== undefined) publication.title = dto.title.trim();
      if (dto.description !== undefined) publication.description = dto.description.trim();
      if (dto.quantity !== undefined) publication.quantity = dto.quantity;
      if (dto.unit !== undefined) publication.unit = dto.unit.trim();
      if (dto.expirationDate !== undefined) {
        publication.expirationDate = this.parseExpirationDate(dto.expirationDate);
      }
      if (dto.status !== undefined) publication.status = dto.status.trim();

      return await this.foodPublicationsRepository.save(publication);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const publication = await this.findOne(id);

    try {
      await this.foodPublicationsRepository.remove(publication);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private validateDto(
    dto: CreateFoodPublicationDto | UpdateFoodPublicationDto,
    required: boolean,
  ): void {
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new BadRequestException('Invalid food publication data');
    }

    const data = dto as Record<string, unknown>;
    const requiredFields = required
      ? ['establishmentId', 'categoryId', 'title', 'unit']
      : [];

    for (const field of requiredFields) {
      const value = data[field];
      if (value === undefined || typeof value !== 'string' || value.trim().length === 0) {
        throw new BadRequestException(`${field} is required`);
      }
    }

    for (const field of ['title', 'unit', 'description', 'status']) {
      const value = data[field];
      if (value !== undefined &&
        (typeof value !== 'string' || value.trim().length === 0 ||
          (field === 'title' && value.trim().length > 150) ||
          ((field === 'unit' || field === 'status') && value.trim().length > 50))) {
        throw new BadRequestException(`Invalid ${field}`);
      }
    }

    if (data.quantity !== undefined &&
      (typeof data.quantity !== 'number' || !Number.isInteger(data.quantity))) {
      throw new BadRequestException('Invalid quantity');
    }
  }

  private validateUuid(value: unknown, field: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return value;
  }

  private parseExpirationDate(value: unknown): Date | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('Invalid expirationDate');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid expirationDate');
    }
    return date;
  }

  private async ensureEstablishmentExists(id: string): Promise<void> {
    try {
      const establishment = await this.establishmentsRepository.findOne({ where: { id } });
      if (!establishment) throw new NotFoundException(`Establishment ${id} not found`);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    try {
      const category = await this.categoriesRepository.findOne({ where: { id } });
      if (!category) throw new NotFoundException(`Category ${id} not found`);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof HttpException) throw error;

    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string } | undefined)?.code;
      if (code === '22P02') throw new BadRequestException('Invalid identifier format');
      if (code === '23505' || code === '23503') {
        throw new ConflictException('Database constraint violation');
      }
      if (code === '23502' || code === '22001' || code === '22003') {
        throw new BadRequestException('Invalid food publication data');
      }
    }

    throw new InternalServerErrorException('Unexpected database error');
  }
}
