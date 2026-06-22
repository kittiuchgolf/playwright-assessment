import { expect, test } from '@playwright/test';
import { GoRestClient } from './clients/gorest-client';
import { uniqueUser } from './user-data';
import { requireEnv } from '../support/env';

test.describe('GoREST users API', () => {
  test('lists users with expected response shape', async ({ request }) => {
    const client = new GoRestClient(request);

    const response = await client.listUsers();

    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);

    for (const user of users.slice(0, 5)) {
      expect(user.id).toEqual(expect.any(Number));
      expect(user.name).toEqual(expect.any(String));
      expect(user.email).toEqual(expect.stringContaining('@'));
      expect(['male', 'female']).toContain(user.gender);
      expect(['active', 'inactive']).toContain(user.status);
    }
  });

  test('gets user details for an existing user', async ({ request }) => {
    const client = new GoRestClient(request);
    const listResponse = await client.listUsers();
    expect(listResponse.status()).toBe(200);

    const users = await listResponse.json();
    expect(users.length).toBeGreaterThan(0);

    const response = await client.getUser(users[0].id);

    const user = await client.expectUserResponse(response, 200);
    expect(user.id).toBe(users[0].id);
  });

  test('creates, updates, and deletes a user with bearer token auth', async ({ request }) => {
    const client = new GoRestClient(request, requireEnv('GOREST_API_TOKEN'));
    const createPayload = uniqueUser();

    const createResponse = await client.createUser(createPayload);
    const createdUser = await client.expectUserResponse(createResponse, 201);
    expect(createdUser).toMatchObject(createPayload);

    const updateResponse = await client.updateUser(createdUser.id, {
      name: `${createPayload.name} Updated`,
      status: 'inactive'
    });
    const updatedUser = await client.expectUserResponse(updateResponse, 200);
    expect(updatedUser.name).toBe(`${createPayload.name} Updated`);
    expect(updatedUser.status).toBe('inactive');

    const deleteResponse = await client.deleteUser(createdUser.id);
    expect(deleteResponse.status()).toBe(204);

    const getDeletedResponse = await client.getUser(createdUser.id);
    await client.expectErrorResponse(getDeletedResponse, 404);
  });

  test('rejects unauthenticated user creation', async ({ request }) => {
    const client = new GoRestClient(request);

    const response = await client.createUser(uniqueUser(), undefined);

    await client.expectErrorResponse(response, 401);
  });

  test('returns not found for an unknown user id', async ({ request }) => {
    const client = new GoRestClient(request);

    const response = await client.getUser(0);

    await client.expectErrorResponse(response, 404);
  });
});
