import {
	Body,
	Controller,
	Get,
	NotImplementedException,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { CreatePickupDto } from './dto/create-pickup.dto';
import { UpdatePickupDto } from './dto/update-pickup.dto';

@Controller('pickups')
export class PickupsController {
	@Get()
	findAll() {
		throw new NotImplementedException('Listing pickups is not implemented yet');
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		throw new NotImplementedException(`Finding pickup ${id} is not implemented yet`);
	}

	@Post()
	create(@Body() createPickupDto: CreatePickupDto) {
		void createPickupDto;
		throw new NotImplementedException('Creating a pickup is not implemented yet');
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() updatePickupDto: UpdatePickupDto) {
		void updatePickupDto;
		throw new NotImplementedException(`Updating pickup ${id} is not implemented yet`);
	}
}
