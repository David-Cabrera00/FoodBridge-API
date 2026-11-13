import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';
import { NotificationsService } from './notifications.service';

// userId scopes the query, but is not an authenticated identity. Authorization
// must be added with the team's future authentication/guards integration.
@ApiTags('notifications')
@Controller('notifications/users/:userId')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(@Param('userId') userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Put(':id/read')
  @ApiOperation({
    summary:
      'Notificacion del usuario actualizada; isRead refleja el booleano enviado.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Notificacion del usuario actualizada; isRead refleja el booleano enviado.',
  })
  @ApiResponse({ status: 400, description: 'Datos o identificador invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Registro referenciado no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Conflicto de datos' })
  @ApiResponse({ status: 500, description: 'Error de persistencia' })
  markRead(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: MarkNotificationReadDto,
  ) {
    return this.service.markRead(userId, id, dto);
  }
}
