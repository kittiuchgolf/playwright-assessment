import type { z } from 'zod';
import type { GoRestErrorSchema, GoRestUserSchema } from '../schemas/user.schema';

export type UserStatus = 'active' | 'inactive';
export type UserGender = 'male' | 'female';

export type GoRestUser = z.infer<typeof GoRestUserSchema>;

export type CreateUserPayload = Omit<GoRestUser, 'id'>;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export type GoRestError = z.infer<typeof GoRestErrorSchema>;
