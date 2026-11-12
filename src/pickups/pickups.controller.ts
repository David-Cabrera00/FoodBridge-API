import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreatePickupDto } from './dto/create-pickup.dto';
import { UpdatePickupDto } from './dto/update-pickup.dto';

import { PickupsService } from './pickups.service';

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
  create(@Body() createPickupDto: CreatePickupDto) {
    return this.service.create(createPickupDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePickupDto: UpdatePickupDto) {
    return this.service.update(id, updatePickupDto);
  }
}
