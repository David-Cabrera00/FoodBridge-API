import { ApiProperty } from '@nestjs/swagger';
export class CreateRequestDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    format: 'uuid',
  })
  userId!: string;
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    format: 'uuid',
  })
  foodPublicationId!: string;
  @ApiProperty({ example: 2 })
  quantity!: number;
}
