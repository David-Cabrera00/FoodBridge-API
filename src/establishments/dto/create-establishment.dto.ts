import { ApiProperty } from '@nestjs/swagger';
export class CreateEstablishmentDto {
  @ApiProperty({ example: 'Demo FoodBridge' })
  name!: string;
  @ApiProperty({ example: 'restaurant' })
  type!: string;
  @ApiProperty({ example: 'Calle Demo 123' })
  address!: string;
  @ApiProperty({ example: '3000000000' })
  phone!: string;
  @ApiProperty({ example: 'video.foodbridge@example.test' })
  email!: string;
}
