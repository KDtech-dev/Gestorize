import { UserType } from 'src/context/types';

export type LoginData = {
  token: string;
  expires_at?: string;
  user: UserType;
};

export type RefreshData = {
  token: string;
  expires_at?: string;
  user: UserType;
};
