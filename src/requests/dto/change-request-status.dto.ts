import { RequestStatus } from '../interfaces/request.interface';

export class ChangeRequestStatusDto {
  status!: RequestStatus;
}