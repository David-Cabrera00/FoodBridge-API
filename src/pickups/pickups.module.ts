import { Module } from '@nestjs/common';
import { PickupsController } from './pickups.controller';

@Module({
  controllers: [PickupsController]
})
export class PickupsModule {}
