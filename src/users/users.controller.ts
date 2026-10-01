import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {

  @Get()
  findAll() {
    return {
      message: 'Get all users',
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      message: `Get user ${id}`,
    };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return {
      message: 'User created',
      data: createUserDto,
    };
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return {
      message: `User ${id} updated`,
      data: updateUserDto,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return {
      message: `User ${id} deleted`,
    };
  }
}