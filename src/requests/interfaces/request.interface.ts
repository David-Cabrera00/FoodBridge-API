export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Request {
  id: string;
  userId: string;
  foodPublicationId: string;
  quantity: number;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}