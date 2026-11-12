export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  // accessToken?: string; // pending: JWT not implemented yet
}
