import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreatePickupDto } from './dto/create-pickup.dto';
import { UpdatePickupDto } from './dto/update-pickup.dto';

import { PickupsService } from './pickups.service';

@ApiTags('pickups')
@Controller('pickups')
export class PickupsController {
  constructor(private readonly service: PickupsService) {}
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Recogida creada; requestId vincula la solicitud. status: scheduled.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Recogida creada; requestId vincula la solicitud. status: scheduled.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Registro referenciado no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  create(@Body() createPickupDto: CreatePickupDto) {
    return this.service.create(createPickupDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePickupDto: UpdatePickupDto) {
    return this.service.update(id, updatePickupDto);
  }
}
