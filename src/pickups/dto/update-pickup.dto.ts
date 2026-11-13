import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PickupStatus } from '../interfaces/pickup.interface';

export class UpdatePickupDto {
  @ApiPropertyOptional({
    example: '2026-12-01T15:00:00-05:00',
    format: 'date-time',
  })
  scheduledAt?: string;
  @ApiPropertyOptional({
    example: 'scheduled',
    enum: ['scheduled', 'completed', 'cancelled'],
  })
  status?: PickupStatus;
}
