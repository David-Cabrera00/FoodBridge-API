import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RequestsController } from './requests.controller';
import { Request } from './entities/request.entity';

import { RequestsService } from './requests.service';
import { User } from '../users/entities/user.entity';
import { FoodPublication } from '../food-publications/entities/food-publication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Request, User, FoodPublication])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
