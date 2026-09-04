export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  mobile_number: string;
  wallet_balance: number;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface UserSession {
  user: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
}
