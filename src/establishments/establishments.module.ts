import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Establishment } from './entities/establishment.entity';
import { EstablishmentsController } from './establishments.controller';
import { EstablishmentsService } from './establishments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Establishment])],
  controllers: [EstablishmentsController],
  providers: [EstablishmentsService],
})
export class EstablishmentsModule {}
