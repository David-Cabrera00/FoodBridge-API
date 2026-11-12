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

import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { Establishment } from './entities/establishment.entity';

const FIELD_LIMITS = {
  name: 150,
  type: 80,
  address: 255,
  phone: 30,
  email: 255,
} as const;

@Injectable()
export class EstablishmentsService {
  constructor(
    @InjectRepository(Establishment)
    private readonly establishmentsRepository: Repository<Establishment>,
  ) {}

  async findAll(): Promise<Establishment[]> {
    try {
      return await this.establishmentsRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findOne(id: string): Promise<Establishment> {
    let establishment: Establishment | null;

    try {
      establishment = await this.establishmentsRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }

    if (!establishment) {
      throw new NotFoundException(`Establishment ${id} not found`);
    }

    return establishment;
  }

  async create(dto: CreateEstablishmentDto): Promise<Establishment> {
    this.validateFields(dto, true);

    try {
      const establishment = this.establishmentsRepository.create({
        name: dto.name.trim(),
        type: dto.type.trim(),
        address: dto.address.trim(),
        phone: dto.phone.trim(),
        email: dto.email.trim(),
      });

      return await this.establishmentsRepository.save(establishment);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async update(
    id: string,
    dto: UpdateEstablishmentDto,
  ): Promise<Establishment> {
    this.validateFields(dto, false);

    const establishment = await this.findOne(id);

    try {
      if (dto.name !== undefined) {
        establishment.name = dto.name.trim();
      }
      if (dto.type !== undefined) {
        establishment.type = dto.type.trim();
      }
      if (dto.address !== undefined) {
        establishment.address = dto.address.trim();
      }
      if (dto.phone !== undefined) {
        establishment.phone = dto.phone.trim();
      }
      if (dto.email !== undefined) {
        establishment.email = dto.email.trim();
      }

      return await this.establishmentsRepository.save(establishment);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const establishment = await this.findOne(id);

    try {
      await this.establishmentsRepository.remove(establishment);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private validateFields(
    dto: CreateEstablishmentDto | UpdateEstablishmentDto,
    required: boolean,
  ): void {
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new BadRequestException('Invalid establishment data');
    }

    const data = dto as Record<string, unknown>;

    for (const [field, maxLength] of Object.entries(FIELD_LIMITS)) {
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
        value.trim().length > maxLength
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
        throw new BadRequestException('Invalid establishment data');
      }
    }

    throw new InternalServerErrorException('Unexpected database error');
  }
}
