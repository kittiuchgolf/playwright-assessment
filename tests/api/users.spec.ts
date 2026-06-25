import { expect, test } from '../fixtures/test';
import { uniqueUser } from './user-data';

test.describe('GoREST users API', () => {
  test('lists users with expected response shape @smoke @api', async ({ goRestClient }) => {
    const response = await goRestClient.listUsers();
    const users = await goRestClient.expectUserListResponse(response, 200);

    expect(users.length).toBeGreaterThan(0);
  });

  test('gets user details for an existing user @api', async ({ goRestClient }) => {
    const listResponse = await goRestClient.listUsers();
    const users = await goRestClient.expectUserListResponse(listResponse, 200);
    expect(users.length).toBeGreaterThan(0);

    const response = await goRestClient.getUser(users[0].id);

    const user = await goRestClient.expectUserResponse(response, 200);
    expect(user.id).toBe(users[0].id);
  });

  test('creates, updates, and deletes a user with bearer token auth @smoke @api @crud', async ({
    authenticatedGoRestClient
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test -- intentional conditional skip when no API token is configured
    test.skip(!process.env.GOREST_API_TOKEN, 'Set GOREST_API_TOKEN to run authenticated CRUD');

    const createPayload = uniqueUser();
    let createdUserId: number | undefined;
    let deletedByTest = false;

    try {
      const createResponse = await authenticatedGoRestClient.createUser(createPayload);
      const createdUser = await authenticatedGoRestClient.expectUserResponse(createResponse, 201);
      createdUserId = createdUser.id;
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
      deletedByTest = true;

      const getDeletedResponse = await authenticatedGoRestClient.getUser(createdUser.id);
      await authenticatedGoRestClient.expectErrorResponse(getDeletedResponse, 404);
    } finally {
      if (createdUserId && !deletedByTest) {
        try {
          const cleanupResponse = await authenticatedGoRestClient.deleteUser(createdUserId);
          if (![204, 404].includes(cleanupResponse.status())) {
            console.warn(`GoREST cleanup returned status ${cleanupResponse.status()} for user ${createdUserId}`);
          }
        } catch (error) {
          console.warn(`GoREST cleanup failed for user ${createdUserId}:`, error);
        }
      }
    }
  });

  test('rejects unauthenticated user creation @api @negative', async ({ goRestClient }) => {
    const response = await goRestClient.createUser(uniqueUser(), undefined);

    await goRestClient.expectErrorResponse(response, 401);
  });

  test('rejects user creation with an invalid email @api @negative @crud', async ({
    authenticatedGoRestClient
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test -- intentional conditional skip when no API token is configured
    test.skip(!process.env.GOREST_API_TOKEN, 'Set GOREST_API_TOKEN to run authenticated CRUD');

    const response = await authenticatedGoRestClient.createUser(uniqueUser({ email: 'not-an-email' }));

    const errors = await authenticatedGoRestClient.expectErrorResponse(response, 422);
    expect(errors.some((error) => error.field === 'email' && /invalid/i.test(error.message))).toBe(true);
  });

  test('returns not found for an unknown user id @api @negative', async ({ goRestClient }) => {
    const response = await goRestClient.getUser(0);

    await goRestClient.expectErrorResponse(response, 404);
  });
});
