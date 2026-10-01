import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { Establishment } from './interfaces/establishment.interface';

@Controller('establishments')
export class EstablishmentsController {
  private establishments: Establishment[] = [];

  @Get()
  findAll(): Establishment[] {
    return this.establishments;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Establishment | undefined {
    return this.establishments.find((establishment) => establishment.id === id);
  }

  @Post()
  create(@Body() createEstablishmentDto: CreateEstablishmentDto) {
    const newEstablishment: Establishment = {
      id: Date.now().toString(),
      ...createEstablishmentDto,
    };

    this.establishments.push(newEstablishment);

    return newEstablishment;
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEstablishmentDto: UpdateEstablishmentDto,
  ) {
    const establishment = this.establishments.find((item) => item.id === id);

    if (!establishment) {
      return {
        message: 'Establishment not found',
      };
    }

    Object.assign(establishment, updateEstablishmentDto);

    return establishment;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const index = this.establishments.findIndex(
      (establishment) => establishment.id === id,
    );

    if (index === -1) {
      return {
        message: 'Establishment not found',
      };
    }

    const deletedEstablishment = this.establishments.splice(index, 1);

    return deletedEstablishment[0];
  }
}
