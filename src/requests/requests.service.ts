import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FoodPublication } from '../food-publications/entities/food-publication.entity';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ChangeRequestStatusDto } from './dto/change-request-status.dto';
import {
  persist,
  validateBody,
  validateQuantity,
  validateUuid,
} from './persistence.util';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(FoodPublication)
    private readonly publications: Repository<FoodPublication>,
  ) {}

  findAll(): Promise<Request[]> {
    return persist(() => this.requests.find({ order: { createdAt: 'DESC' } }));
  }

  async findOne(id: string): Promise<Request> {
    validateUuid(id, 'id');
    const request = await persist(() =>
      this.requests.findOne({ where: { id } }),
    );
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return request;
  }

  async create(dto: CreateRequestDto): Promise<Request> {
    validateBody(dto, ['userId', 'foodPublicationId', 'quantity']);
    validateUuid(dto.userId, 'userId');
    validateUuid(dto.foodPublicationId, 'foodPublicationId');
    validateQuantity(dto.quantity);
    await this.ensureReferences(dto.userId, dto.foodPublicationId);
    return persist(() =>
      this.requests.save(
        this.requests.create({
          userId: dto.userId,
          foodPublicationId: dto.foodPublicationId,
          quantity: dto.quantity,
          status: 'pending',
        }),
      ),
    );
  }

  async update(id: string, dto: UpdateRequestDto): Promise<Request> {
    validateBody(dto, ['quantity']);
    if ('quantity' in dto) validateQuantity(dto.quantity);
    const request = await this.findOne(id);
    await this.ensureReferences(request.userId, request.foodPublicationId);
    if (dto.quantity !== undefined) request.quantity = dto.quantity;
    return persist(() => this.requests.save(request));
  }

  async remove(id: string): Promise<void> {
    const request = await this.findOne(id);
    await persist(() => this.requests.remove(request));
  }

  accept(id: string, dto: ChangeRequestStatusDto): Promise<Request> {
    return this.changeStatus(id, dto, 'accepted');
  }

  reject(id: string, dto: ChangeRequestStatusDto): Promise<Request> {
    return this.changeStatus(id, dto, 'rejected');
  }

  private async changeStatus(
    id: string,
    dto: ChangeRequestStatusDto,
    expected: 'accepted' | 'rejected',
  ): Promise<Request> {
    validateBody(dto, ['status']);
    if (dto.status !== expected) {
      throw new BadRequestException(
        `status must be ${expected} for this route`,
      );
    }
    const request = await this.findOne(id);
    await this.ensureReferences(request.userId, request.foodPublicationId);
    request.status = dto.status;
    return persist(() => this.requests.save(request));
  }

  private async ensureReferences(
    userId: string,
    foodPublicationId: string,
  ): Promise<void> {
    validateUuid(userId, 'userId');
    validateUuid(foodPublicationId, 'foodPublicationId');
    if (!(await persist(() => this.users.exists({ where: { id: userId } })))) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (
      !(await persist(() =>
        this.publications.exists({ where: { id: foodPublicationId } }),
      ))
    ) {
      throw new NotFoundException(
        `Food publication ${foodPublicationId} not found`,
      );
    }
  }
}
