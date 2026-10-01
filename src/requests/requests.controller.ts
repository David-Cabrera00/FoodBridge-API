import {
	Controller,
	Body,
	Delete,
	Get,
	NotImplementedException,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { ChangeRequestStatusDto } from './dto/change-request-status.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Controller('requests')
export class RequestsController {
	@Get()
	findAll() {
		throw new NotImplementedException('Listing requests is not implemented yet');
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		throw new NotImplementedException(`Finding request ${id} is not implemented yet`);
	}

	@Post()
	create(@Body() createRequestDto: CreateRequestDto) {
		void createRequestDto;
		throw new NotImplementedException('Creating a request is not implemented yet');
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
		void updateRequestDto;
		throw new NotImplementedException(`Updating request ${id} is not implemented yet`);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		throw new NotImplementedException(`Deleting request ${id} is not implemented yet`);
	}

	@Put(':id/accept')
	accept(
		@Param('id') id: string,
		@Body() changeRequestStatusDto: ChangeRequestStatusDto,
	) {
		void changeRequestStatusDto;
		throw new NotImplementedException(`Accepting request ${id} is not implemented yet`);
	}

	@Put(':id/reject')
	reject(
		@Param('id') id: string,
		@Body() changeRequestStatusDto: ChangeRequestStatusDto,
	) {
		void changeRequestStatusDto;
		throw new NotImplementedException(`Rejecting request ${id} is not implemented yet`);
	}
}
