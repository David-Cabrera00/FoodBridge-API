import { ApiProperty } from '@nestjs/swagger';
export class CreatePickupDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    format: 'uuid',
  })
  requestId!: string;
  @ApiProperty({ example: '2026-12-01T15:00:00-05:00', format: 'date-time' })
  scheduledAt!: string;
}
