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

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { hashPassword } from './password.util';
import {
  assertValid,
  normalizeEmail,
  validateUserFields,
} from './users.validation';

const PG_UNIQUE_VIOLATION = '23505';
const PG_INVALID_TEXT_REPRESENTATION = '22P02';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find({ order: { createdAt: 'ASC' } });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findOne(id: string): Promise<User> {
    let user: User | null;
    try {
      user = await this.usersRepository.findOne({ where: { id } });
    } catch (error) {
      this.handlePersistenceError(error);
    }
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /** Internal use by auth: includes the password hash (select: false). */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    try {
      return await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email: normalizeEmail(email) })
        .getOne();
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    assertValid(validateUserFields(dto ?? {}, true));
    const email = normalizeEmail(dto.email);

    try {
      if (await this.usersRepository.exists({ where: { email } })) {
        throw new ConflictException('Email is already registered');
      }
      const user = this.usersRepository.create({
        name: dto.name.trim(),
        email,
        password: await hashPassword(dto.password),
      });
      return this.withoutPassword(await this.usersRepository.save(user));
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    assertValid(validateUserFields(dto ?? {}, false));
    const user = await this.findOne(id);

    try {
      if (dto.name !== undefined) user.name = dto.name.trim();
      if (dto.email !== undefined) {
        const email = normalizeEmail(dto.email);
        if (email !== user.email) {
          if (await this.usersRepository.exists({ where: { email } })) {
            throw new ConflictException('Email is already registered');
          }
          user.email = email;
        }
      }
      if (dto.password !== undefined) {
        user.password = await hashPassword(dto.password);
      }
      return this.withoutPassword(await this.usersRepository.save(user));
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    try {
      await this.usersRepository.remove(user);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private withoutPassword(user: User): User {
    const { password: _password, ...rest } = user;
    return rest as User;
  }

  /** Re-throws HTTP exceptions untouched; maps DB errors to proper statuses. */
  private handlePersistenceError(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string } | undefined)?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Email is already registered');
      }
      if (code === PG_INVALID_TEXT_REPRESENTATION) {
        throw new BadRequestException('Invalid identifier format');
      }
    }
    throw new InternalServerErrorException('Unexpected database error');
  }
}
