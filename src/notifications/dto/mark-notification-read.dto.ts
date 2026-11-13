import { ApiProperty } from '@nestjs/swagger';
export class MarkNotificationReadDto {
  @ApiProperty({ example: true })
  isRead: boolean;
}
