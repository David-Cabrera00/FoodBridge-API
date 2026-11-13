import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateFoodPublicationDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    format: 'uuid',
  })
  establishmentId: string;
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    format: 'uuid',
  })
  categoryId: string;
  @ApiProperty({ example: 'Canasta de frutas demo' })
  title: string;
  @ApiPropertyOptional({ example: 'Datos ficticios para la demo' })
  description: string;
  @ApiPropertyOptional({ example: 2 })
  quantity: number;
  @ApiProperty({ example: 'kg' })
  unit: string;
  @ApiPropertyOptional({
    example: '2026-12-02T18:00:00-05:00',
    format: 'date-time',
  })
  expirationDate: string;
}
