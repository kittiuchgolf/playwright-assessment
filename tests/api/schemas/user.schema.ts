import { z } from 'zod';

export const GoRestUserStatusSchema = z.enum(['active', 'inactive']);
export const GoRestUserGenderSchema = z.enum(['male', 'female']);

export const GoRestUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  gender: GoRestUserGenderSchema,
  status: GoRestUserStatusSchema
});

export const GoRestUserListSchema = z.array(GoRestUserSchema);

export const GoRestErrorSchema = z.object({
  field: z.string().optional(),
  message: z.string().min(1)
});

export const GoRestErrorListSchema = z.array(GoRestErrorSchema);
