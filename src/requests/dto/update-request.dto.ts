import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateRequestDto {
  @ApiPropertyOptional({ example: 2 })
  quantity?: number;
}
