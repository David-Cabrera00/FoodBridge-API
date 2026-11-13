import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('requests')
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
  @ApiOperation({ summary: 'Solicitud creada; copiar id. status: pending.' })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada; copiar id. status: pending.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Registro referenciado no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
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
  @ApiOperation({
    summary: 'Misma solicitud con status: accepted. Enviar status accepted.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Misma solicitud con status: accepted. Enviar status accepted.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Registro referenciado no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
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
