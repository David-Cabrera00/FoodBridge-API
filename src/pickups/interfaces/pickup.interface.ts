export type PickupStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Pickup {
  id: string;
  requestId: string;
  scheduledAt: string;
  status: PickupStatus;
  createdAt: string;
  updatedAt: string;
}