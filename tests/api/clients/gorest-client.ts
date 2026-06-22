import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { CreateUserPayload, GoRestError, GoRestUser, UpdateUserPayload } from '../types/user';

export class GoRestClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string
  ) {}

  async listUsers(): Promise<APIResponse> {
    return this.request.get('users');
  }

  async getUser(id: number): Promise<APIResponse> {
    return this.request.get(`users/${id}`);
  }

  async createUser(payload: CreateUserPayload, token = this.token): Promise<APIResponse> {
    return this.request.post('users', {
      headers: this.authHeaders(token),
      data: payload
    });
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<APIResponse> {
    return this.request.put(`users/${id}`, {
      headers: this.authHeaders(this.token),
      data: payload
    });
  }

  async deleteUser(id: number): Promise<APIResponse> {
    return this.request.delete(`users/${id}`, {
      headers: this.authHeaders(this.token)
    });
  }

  async expectUserResponse(response: APIResponse, expectedStatus: number): Promise<GoRestUser> {
    expect(response.status()).toBe(expectedStatus);
    const body = (await response.json()) as GoRestUser;

    expect(body.id).toEqual(expect.any(Number));
    expect(body.name).toEqual(expect.any(String));
    expect(body.email).toEqual(expect.stringContaining('@'));
    expect(['male', 'female']).toContain(body.gender);
    expect(['active', 'inactive']).toContain(body.status);

    return body;
  }

  async expectErrorResponse(response: APIResponse, expectedStatus: number): Promise<GoRestError[]> {
    expect(response.status()).toBe(expectedStatus);
    const body = (await response.json()) as GoRestError[] | GoRestError;
    const errors = Array.isArray(body) ? body : [body];

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toEqual(expect.any(String));

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
}
