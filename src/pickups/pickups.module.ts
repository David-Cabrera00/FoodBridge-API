import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PickupsController } from './pickups.controller';
import { Pickup } from './entities/pickup.entity';

import { PickupsService } from './pickups.service';
import { Request } from '../requests/entities/request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pickup, Request])],
  controllers: [PickupsController],
  providers: [PickupsService],
})
export class PickupsModule {}
