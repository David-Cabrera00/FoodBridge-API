import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateFoodPublicationDto } from './dto/create-food-publication.dto';
import { UpdateFoodPublicationDto } from './dto/update-food-publication.dto';
import { FoodPublicationsService } from './food-publications.service';

@ApiTags('food-publications')
@Controller('food-publications')
export class FoodPublicationsController {
  constructor(
    private readonly foodPublicationsService: FoodPublicationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Publicacion creada; copiar id. status: available.',
  })
  @ApiResponse({
    status: 201,
    description: 'Publicacion creada; copiar id. status: available.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Registro referenciado no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  create(@Body() dto: CreateFoodPublicationDto) {
    return this.foodPublicationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.foodPublicationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Publicacion recuperada por su id.' })
  @ApiResponse({
    status: 200,
    description: 'Publicacion recuperada por su id.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Registro referenciado no encontrado',
  })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodPublicationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodPublicationDto,
  ) {
    return this.foodPublicationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodPublicationsService.remove(id);
  }
}
