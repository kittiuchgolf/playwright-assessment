import { test } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { InventoryPage } from './pages/inventory.page';
import { sauceUsers } from '../support/users';

test.describe('SauceDemo authentication', () => {
  test('standard user can log in and land on inventory', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(sauceUsers.standard.username, sauceUsers.standard.password);

    await inventoryPage.expectLoaded();
  });

  test('locked out user sees a clear login error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(sauceUsers.lockedOut.username, sauceUsers.lockedOut.password);

    await loginPage.expectErrorContains('Sorry, this user has been locked out.');
  });
});
