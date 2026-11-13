import { ApiProperty } from '@nestjs/swagger';
import type { RequestStatus } from '../interfaces/request.interface';

export class ChangeRequestStatusDto {
  @ApiProperty({
    example: 'accepted',
    enum: ['pending', 'accepted', 'rejected'],
  })
  status!: RequestStatus;
}
