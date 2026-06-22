export type UserStatus = 'active' | 'inactive';
export type UserGender = 'male' | 'female';

export interface GoRestUser {
  id: number;
  name: string;
  email: string;
  gender: UserGender;
  status: UserStatus;
}

export type CreateUserPayload = Omit<GoRestUser, 'id'>;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface GoRestError {
  field?: string;
  message: string;
}
