import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPublication } from './entities/food-publication.entity';
import { FoodPublicationsController } from './food-publications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodPublication])],
  controllers: [FoodPublicationsController],
})
export class FoodPublicationsModule {}
