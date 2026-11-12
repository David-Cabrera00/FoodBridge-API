import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

// Local helpers for requests, pickups and notifications; no global pipe required.
export function validateUuid(
  value: unknown,
  field: string,
): asserts value is string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new BadRequestException(`Invalid ${field}`);
  }
}

export function validateBody(value: unknown, fields: string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Expected an object');
  }
  if (Object.keys(value).some((field) => !fields.includes(field))) {
    throw new BadRequestException('Unknown fields');
  }
}

export function validateQuantity(value: unknown): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new BadRequestException('quantity must be a positive finite number');
  }
}

export async function persist<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpException) throw error;
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string } | undefined)?.code;
      if (code?.startsWith('23')) {
        throw new ConflictException('Database constraint violation');
      }
      if (
        code &&
        ['22P02', '22001', '22003', '22007', '22008'].includes(code)
      ) {
        throw new BadRequestException('Invalid data');
      }
    }
    throw new InternalServerErrorException('Unexpected database error');
  }
}
