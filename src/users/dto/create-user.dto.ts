import { ApiProperty } from '@nestjs/swagger';
export class CreateUserDto {
  @ApiProperty({ example: 'Demo FoodBridge' })
  name: string;
  @ApiProperty({ example: 'video.foodbridge@example.test' })
  email: string;
  @ApiProperty({ example: 'DemoFoodBridge2026!' })
  password: string;
}
