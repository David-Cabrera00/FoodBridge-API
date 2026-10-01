import { PickupStatus } from '../interfaces/pickup.interface';

export class UpdatePickupDto {
  scheduledAt?: string;
  status?: PickupStatus;
}