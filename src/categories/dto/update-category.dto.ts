import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Demo FoodBridge' })
  name?: string;
  @ApiPropertyOptional({ example: 'Datos ficticios para la demo' })
  description?: string;
}
