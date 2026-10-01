import { Module } from '@nestjs/common';
import { FoodPublicationsController } from './food-publications.controller';

@Module({
  controllers: [FoodPublicationsController]
})
export class FoodPublicationsModule {}
