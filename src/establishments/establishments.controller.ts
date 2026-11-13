import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';

import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { EstablishmentsService } from './establishments.service';

@ApiTags('establishments')
@Controller('establishments')
export class EstablishmentsController {
  constructor(private readonly establishmentsService: EstablishmentsService) {}

  @Get()
  findAll() {
    return this.establishmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Establecimiento creado; copiar id.' })
  @ApiResponse({
    status: 201,
    description: 'Establecimiento creado; copiar id.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  create(@Body() createEstablishmentDto: CreateEstablishmentDto) {
    return this.establishmentsService.create(createEstablishmentDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEstablishmentDto: UpdateEstablishmentDto,
  ) {
    return this.establishmentsService.update(id, updateEstablishmentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.remove(id);
  }
}
