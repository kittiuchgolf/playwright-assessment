import { test } from '../fixtures/test';
import { sauceUsers } from '../support/users';

test.describe('SauceDemo authentication', () => {
  test('standard user can log in and land on inventory @smoke @ui @auth', async ({ loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(sauceUsers.standard.username, sauceUsers.standard.password);

    await inventoryPage.expectLoaded();
  });

  test('locked out user sees a clear login error @ui @auth @negative', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(sauceUsers.lockedOut.username, sauceUsers.lockedOut.password);

    await loginPage.expectErrorContains('Sorry, this user has been locked out.');
  });

  test('unauthenticated user cannot deep-link into inventory @ui @auth @negative @session', async ({ loginPage }) => {
    await loginPage.gotoProtectedPath('/inventory.html');

    await loginPage.expectErrorContains("You can only access '/inventory.html' when you are logged in.");
    await loginPage.expectLoginPageShown();
  });
});
