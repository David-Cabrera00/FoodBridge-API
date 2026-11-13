import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({ example: 'video.foodbridge@example.test' })
  email: string;
  @ApiProperty({ example: 'DemoFoodBridge2026!' })
  password: string;
}
