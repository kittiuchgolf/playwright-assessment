import type { CreateUserPayload } from './types/user';

export function uniqueUser(overrides: Partial<CreateUserPayload> = {}): CreateUserPayload {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    name: `Assessment User ${uniqueId}`,
    email: `assessment-${uniqueId}@example.com`,
    gender: 'male',
    status: 'active',
    ...overrides
  };
}
