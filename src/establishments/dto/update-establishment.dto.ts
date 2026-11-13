import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateEstablishmentDto {
  @ApiPropertyOptional({ example: 'Demo FoodBridge' })
  name?: string;
  @ApiPropertyOptional({ example: 'restaurant' })
  type?: string;
  @ApiPropertyOptional({ example: 'Calle Demo 123' })
  address?: string;
  @ApiPropertyOptional({ example: '3000000000' })
  phone?: string;
  @ApiPropertyOptional({ example: 'video.foodbridge@example.test' })
  email?: string;
}
