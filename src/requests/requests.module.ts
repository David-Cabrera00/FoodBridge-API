import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RequestsController } from './requests.controller';
import { Request } from './entities/request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Request])],
  controllers: [RequestsController],
})
export class RequestsModule {}