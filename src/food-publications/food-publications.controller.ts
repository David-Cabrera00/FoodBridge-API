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

@Controller('food-publications')
export class FoodPublicationsController {
  constructor(private readonly foodPublicationsService: FoodPublicationsService) {}

  @Post()
  create(@Body() dto: CreateFoodPublicationDto) {
    return this.foodPublicationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.foodPublicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodPublicationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFoodPublicationDto) {
    return this.foodPublicationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodPublicationsService.remove(id);
  }
}
