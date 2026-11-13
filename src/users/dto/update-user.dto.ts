import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Demo FoodBridge' })
  name?: string;
  @ApiPropertyOptional({ example: 'video.foodbridge@example.test' })
  email?: string;
  @ApiPropertyOptional({ example: 'DemoFoodBridge2026!' })
  password?: string;
}
