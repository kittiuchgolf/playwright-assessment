import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { GoRestErrorListSchema, GoRestUserListSchema, GoRestUserSchema } from '../schemas/user.schema';
import type { CreateUserPayload, GoRestError, GoRestUser, UpdateUserPayload } from '../types/user';

type RetryOptions = {
  retries: number;
  retryDelayMs: number;
};

const defaultRetryOptions: RetryOptions = {
  retries: 2,
  retryDelayMs: 300
};

export class GoRestClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
    private readonly retryOptions = defaultRetryOptions
  ) {}

  async listUsers(): Promise<APIResponse> {
    return this.withTransientRetry(() => this.request.get('users'));
  }

  async getUser(id: number): Promise<APIResponse> {
    return this.withTransientRetry(() => this.request.get(`users/${id}`));
  }

  async createUser(payload: CreateUserPayload, token = this.token): Promise<APIResponse> {
    return this.withTransientRetry(() => this.request.post('users', {
      headers: this.authHeaders(token),
      data: payload
    }));
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<APIResponse> {
    return this.withTransientRetry(() => this.request.put(`users/${id}`, {
      headers: this.authHeaders(this.token),
      data: payload
    }));
  }

  async deleteUser(id: number): Promise<APIResponse> {
    return this.withTransientRetry(() => this.request.delete(`users/${id}`, {
      headers: this.authHeaders(this.token)
    }));
  }

  async expectUserResponse(response: APIResponse, expectedStatus: number): Promise<GoRestUser> {
    expect(response.status()).toBe(expectedStatus);
    const body = GoRestUserSchema.parse(await response.json());

    expect(body.email).toContain('@');

    return body;
  }

  async expectUserListResponse(response: APIResponse, expectedStatus: number): Promise<GoRestUser[]> {
    expect(response.status()).toBe(expectedStatus);

    return GoRestUserListSchema.parse(await response.json());
  }

  async expectErrorResponse(response: APIResponse, expectedStatus: number): Promise<GoRestError[]> {
    expect(response.status()).toBe(expectedStatus);
    const body = (await response.json()) as GoRestError[] | GoRestError;
    const errors = GoRestErrorListSchema.parse(Array.isArray(body) ? body : [body]);

    expect(errors.length).toBeGreaterThan(0);

    return errors;
  }

  private authHeaders(token?: string): Record<string, string> {
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }

  private async withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryOptions.retries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isTransientRequestError(error) || attempt === this.retryOptions.retries) {
          throw error;
        }

        await this.delay(this.retryOptions.retryDelayMs);
      }
    }

    throw lastError;
  }

  private isTransientRequestError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);

    return [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EAI_AGAIN',
      'ENOTFOUND',
      'socket hang up'
    ].some((transientSignal) => message.includes(transientSignal));
  }

  private async delay(milliseconds: number): Promise<void> {
    if (milliseconds <= 0) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}
