import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { GoRestClient } from './gorest-client';

function requestDouble(overrides: Partial<APIRequestContext>): APIRequestContext {
  return overrides as APIRequestContext;
}

test.describe('GoRestClient retry behavior', () => {
  test('retries transient API request failures before returning a response @api', async () => {
    let attempts = 0;
    const response = { status: () => 204 } as APIResponse;
    const request = requestDouble({
      delete: async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('read ECONNRESET');
        }

        return response;
      }
    });

    const client = new GoRestClient(request, 'token', { retries: 2, retryDelayMs: 0 });

    const result = await client.deleteUser(123);

    expect(result).toBe(response);
    expect(attempts).toBe(3);
  });

  test('does not retry non-transient API request failures @api', async () => {
    let attempts = 0;
    const request = requestDouble({
      get: async () => {
        attempts += 1;
        throw new Error('invalid request payload');
      }
    });

    const client = new GoRestClient(request, 'token', { retries: 2, retryDelayMs: 0 });

    await expect(client.getUser(123)).rejects.toThrow('invalid request payload');
    expect(attempts).toBe(1);
  });
});
