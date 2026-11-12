import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPublication } from './entities/food-publication.entity';
import { FoodPublicationsController } from './food-publications.controller';
import { FoodPublicationsService } from './food-publications.service';
import { Establishment } from '../establishments/entities/establishment.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FoodPublication, Establishment, Category])],
  controllers: [FoodPublicationsController],
  providers: [FoodPublicationsService],
})
export class FoodPublicationsModule {}
