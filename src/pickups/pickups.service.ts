import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from '../requests/entities/request.entity';
import {
  persist,
  validateBody,
  validateUuid,
} from '../requests/persistence.util';
import { Pickup } from './entities/pickup.entity';
import { CreatePickupDto } from './dto/create-pickup.dto';
import { UpdatePickupDto } from './dto/update-pickup.dto';

@Injectable()
export class PickupsService {
  constructor(
    @InjectRepository(Pickup) private readonly pickups: Repository<Pickup>,
    @InjectRepository(Request) private readonly requests: Repository<Request>,
  ) {}

  findAll(): Promise<Pickup[]> {
    return persist(() => this.pickups.find({ order: { createdAt: 'DESC' } }));
  }

  async findOne(id: string): Promise<Pickup> {
    validateUuid(id, 'id');
    const pickup = await persist(() => this.pickups.findOne({ where: { id } }));
    if (!pickup) throw new NotFoundException(`Pickup ${id} not found`);
    return pickup;
  }

  async create(dto: CreatePickupDto): Promise<Pickup> {
    validateBody(dto, ['requestId', 'scheduledAt']);
    validateUuid(dto.requestId, 'requestId');
    const scheduledAt = this.parseScheduledAt(dto.scheduledAt);
    await this.ensureRequestExists(dto.requestId);
    return persist(() =>
      this.pickups.save(
        this.pickups.create({
          requestId: dto.requestId,
          scheduledAt,
          status: 'scheduled',
        }),
      ),
    );
  }

  async update(id: string, dto: UpdatePickupDto): Promise<Pickup> {
    validateBody(dto, ['scheduledAt', 'status']);
    const scheduledAt =
      'scheduledAt' in dto ? this.parseScheduledAt(dto.scheduledAt) : undefined;
    if (
      'status' in dto &&
      !['scheduled', 'completed', 'cancelled'].includes(dto.status as string)
    ) {
      throw new BadRequestException('Invalid status');
    }
    const pickup = await this.findOne(id);
    await this.ensureRequestExists(pickup.requestId);
    if (scheduledAt !== undefined) pickup.scheduledAt = scheduledAt;
    if (dto.status !== undefined) pickup.status = dto.status;
    return persist(() => this.pickups.save(pickup));
  }

  private async ensureRequestExists(id: string): Promise<void> {
    validateUuid(id, 'requestId');
    if (!(await persist(() => this.requests.exists({ where: { id } })))) {
      throw new NotFoundException(`Request ${id} not found`);
    }
  }

  private parseScheduledAt(value: unknown): Date {
    // Require an unambiguous ISO timestamp, including a timezone. Check calendar
    // components separately because Date silently normalizes e.g. February 30.
    const match =
      typeof value === 'string'
        ? /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
            value,
          )
        : null;
    if (!match)
      throw new BadRequestException(
        'scheduledAt must be a valid ISO timestamp with timezone',
      );
    const [, year, month, day] = match;
    const calendar = new Date(0);
    calendar.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
    const date = new Date(value as string);
    if (
      calendar.getUTCFullYear() !== Number(year) ||
      calendar.getUTCMonth() !== Number(month) - 1 ||
      calendar.getUTCDate() !== Number(day) ||
      !Number.isFinite(date.getTime())
    ) {
      throw new BadRequestException('Invalid scheduledAt');
    }
    return date;
  }
}
