import { expect, test } from '../fixtures/test';
import { uniqueUser } from './user-data';

test.describe('GoREST users API', () => {
  test('lists users with expected response shape', async ({ goRestClient }) => {
    const response = await goRestClient.listUsers();
    const users = await goRestClient.expectUserListResponse(response, 200);

    expect(users.length).toBeGreaterThan(0);
  });

  test('gets user details for an existing user', async ({ goRestClient }) => {
    const listResponse = await goRestClient.listUsers();
    const users = await goRestClient.expectUserListResponse(listResponse, 200);
    expect(users.length).toBeGreaterThan(0);

    const response = await goRestClient.getUser(users[0].id);

    const user = await goRestClient.expectUserResponse(response, 200);
    expect(user.id).toBe(users[0].id);
  });

  test('creates, updates, and deletes a user with bearer token auth', async ({ authenticatedGoRestClient }) => {
    const createPayload = uniqueUser();

    const createResponse = await authenticatedGoRestClient.createUser(createPayload);
    const createdUser = await authenticatedGoRestClient.expectUserResponse(createResponse, 201);
    expect(createdUser).toMatchObject(createPayload);

    const updateResponse = await authenticatedGoRestClient.updateUser(createdUser.id, {
      name: `${createPayload.name} Updated`,
      status: 'inactive'
    });
    const updatedUser = await authenticatedGoRestClient.expectUserResponse(updateResponse, 200);
    expect(updatedUser.name).toBe(`${createPayload.name} Updated`);
    expect(updatedUser.status).toBe('inactive');

    const deleteResponse = await authenticatedGoRestClient.deleteUser(createdUser.id);
    expect(deleteResponse.status()).toBe(204);

    const getDeletedResponse = await authenticatedGoRestClient.getUser(createdUser.id);
    await authenticatedGoRestClient.expectErrorResponse(getDeletedResponse, 404);
  });

  test('rejects unauthenticated user creation', async ({ goRestClient }) => {
    const response = await goRestClient.createUser(uniqueUser(), undefined);

    await goRestClient.expectErrorResponse(response, 401);
  });

  test('returns not found for an unknown user id', async ({ goRestClient }) => {
    const response = await goRestClient.getUser(0);

    await goRestClient.expectErrorResponse(response, 404);
  });
});
