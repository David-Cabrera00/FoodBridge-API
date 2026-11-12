import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  persist,
  validateBody,
  validateUuid,
} from '../requests/persistence.util';
import { Notification } from './entities/notification.entity';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async findAll(userId: string): Promise<Notification[]> {
    await this.ensureUserExists(userId);
    return persist(() =>
      this.notifications.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    );
  }

  async findOne(userId: string, id: string): Promise<Notification> {
    validateUuid(id, 'id');
    await this.ensureUserExists(userId);
    const notification = await persist(() =>
      this.notifications.findOne({
        where: { id, userId },
      }),
    );
    if (!notification)
      throw new NotFoundException(`Notification ${id} not found`);
    return notification;
  }

  async markRead(
    userId: string,
    id: string,
    dto: MarkNotificationReadDto,
  ): Promise<Notification> {
    validateBody(dto, ['isRead']);
    if (typeof dto.isRead !== 'boolean')
      throw new BadRequestException('isRead must be a boolean');
    const notification = await this.findOne(userId, id);
    notification.isRead = dto.isRead;
    return persist(() => this.notifications.save(notification));
  }

  private async ensureUserExists(id: string): Promise<void> {
    validateUuid(id, 'userId');
    if (!(await persist(() => this.users.exists({ where: { id } })))) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
