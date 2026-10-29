import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PickupsController } from './pickups.controller';
import { Pickup } from './entities/pickup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pickup])],
  controllers: [PickupsController],
})
export class PickupsModule {}