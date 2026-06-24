import { test as base, expect } from '@playwright/test';
import { GoRestClient } from '../api/clients/gorest-client';
import { requireEnv } from '../support/env';
import { sauceUsers } from '../support/users';
import { CartPage } from '../ui/pages/cart.page';
import { CheckoutPage } from '../ui/pages/checkout.page';
import { InventoryPage } from '../ui/pages/inventory.page';
import { LoginPage } from '../ui/pages/login.page';

type AssessmentFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loggedInInventoryPage: InventoryPage;
  goRestClient: GoRestClient;
  authenticatedGoRestClient: GoRestClient;
};

export const test = base.extend<AssessmentFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  loggedInInventoryPage: async ({ loginPage, inventoryPage }, use) => {
    await loginPage.goto();
    await loginPage.login(sauceUsers.standard.username, sauceUsers.standard.password);
    await inventoryPage.expectLoaded();

    await use(inventoryPage);
  },

  goRestClient: async ({ request }, use) => {
    await use(new GoRestClient(request));
  },

  authenticatedGoRestClient: async ({ request }, use) => {
    await use(new GoRestClient(request, requireEnv('GOREST_API_TOKEN')));
  }
});

export { expect };
