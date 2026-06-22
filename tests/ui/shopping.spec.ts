import { expect, test } from '@playwright/test';
import { CartPage } from './pages/cart.page';
import { CheckoutPage } from './pages/checkout.page';
import { InventoryPage } from './pages/inventory.page';
import { LoginPage } from './pages/login.page';
import { checkoutCustomer } from '../support/checkout-data';
import { products } from '../support/products';
import { sauceUsers } from '../support/users';

test.describe('SauceDemo shopping workflows', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(sauceUsers.standard.username, sauceUsers.standard.password);
    await new InventoryPage(page).expectLoaded();
  });

  test('user can add and remove an item from the cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);

    await inventoryPage.addItem(products.backpack);
    await inventoryPage.expectCartCount(1);
    await inventoryPage.openCart();
    await cartPage.expectLoaded();
    await cartPage.expectItemVisible(products.backpack);

    await cartPage.removeItem(products.backpack);

    await cartPage.expectCartEmpty();
  });

  test('user can complete checkout for selected products', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await inventoryPage.addItem(products.backpack);
    await inventoryPage.addItem(products.bikeLight);
    await inventoryPage.expectCartCount(2);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.fillCustomerInformation(
      checkoutCustomer.firstName,
      checkoutCustomer.lastName,
      checkoutCustomer.postalCode
    );
    await checkoutPage.expectOverviewContains(products.backpack);
    await checkoutPage.finish();

    await checkoutPage.expectComplete();
  });

  test('user can sort products by price from low to high', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getVisiblePrices();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });
});
