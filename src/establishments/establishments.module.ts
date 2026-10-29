import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Establishment } from './entities/establishment.entity';
import { EstablishmentsController } from './establishments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Establishment])],
  controllers: [EstablishmentsController],
})
export class EstablishmentsModule {}
