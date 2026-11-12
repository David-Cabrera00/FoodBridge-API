import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ChangeRequestStatusDto } from './dto/change-request-status.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() createRequestDto: CreateRequestDto) {
    return this.service.create(createRequestDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.service.update(id, updateRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Put(':id/accept')
  accept(
    @Param('id') id: string,
    @Body() changeRequestStatusDto: ChangeRequestStatusDto,
  ) {
    return this.service.accept(id, changeRequestStatusDto);
  }

  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() changeRequestStatusDto: ChangeRequestStatusDto,
  ) {
    return this.service.reject(id, changeRequestStatusDto);
  }
}
