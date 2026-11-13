import { ApiProperty } from '@nestjs/swagger';
export class CreateCategoryDto {
  @ApiProperty({ example: 'Demo FoodBridge' })
  name!: string;
  @ApiProperty({ example: 'Datos ficticios para la demo' })
  description!: string;
}
