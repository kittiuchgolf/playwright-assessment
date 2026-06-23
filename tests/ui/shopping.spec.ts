import { expect, test } from '../fixtures/test';
import { checkoutCustomer } from '../support/checkout-data';
import { products } from '../support/products';
import type { CartPage } from './pages/cart.page';
import type { CheckoutPage } from './pages/checkout.page';
import type { InventoryPage } from './pages/inventory.page';

test.describe('SauceDemo shopping workflows', () => {
  async function startCheckout(
    loggedInInventoryPage: InventoryPage,
    cartPage: CartPage,
    checkoutPage: CheckoutPage
  ): Promise<void> {
    const inventoryPage = loggedInInventoryPage;
    await inventoryPage.addItem(products.backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutPage.expectInformationStep();
  }

  test('user can add and remove an item from the cart @smoke @ui @cart', async ({
    loggedInInventoryPage,
    cartPage
  }) => {
    const inventoryPage = loggedInInventoryPage;
    await inventoryPage.addItem(products.backpack);
    await inventoryPage.expectCartCount(1);
    await inventoryPage.openCart();
    await cartPage.expectLoaded();
    await cartPage.expectItemVisible(products.backpack);

    await cartPage.removeItem(products.backpack);

    await cartPage.expectCartEmpty();
  });

  test('user can complete checkout for selected products @smoke @ui @checkout', async ({
    loggedInInventoryPage,
    cartPage,
    checkoutPage
  }) => {
    const inventoryPage = loggedInInventoryPage;
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

  test('checkout requires first name @ui @checkout @negative', async ({
    loggedInInventoryPage,
    cartPage,
    checkoutPage
  }) => {
    await startCheckout(loggedInInventoryPage, cartPage, checkoutPage);

    await checkoutPage.fillCustomerInformation('', checkoutCustomer.lastName, checkoutCustomer.postalCode);

    await checkoutPage.expectValidationError('Error: First Name is required');
  });

  test('checkout requires last name @ui @checkout @negative', async ({
    loggedInInventoryPage,
    cartPage,
    checkoutPage
  }) => {
    await startCheckout(loggedInInventoryPage, cartPage, checkoutPage);

    await checkoutPage.fillCustomerInformation(checkoutCustomer.firstName, '', checkoutCustomer.postalCode);

    await checkoutPage.expectValidationError('Error: Last Name is required');
  });

  test('checkout requires postal code @ui @checkout @negative', async ({
    loggedInInventoryPage,
    cartPage,
    checkoutPage
  }) => {
    await startCheckout(loggedInInventoryPage, cartPage, checkoutPage);

    await checkoutPage.fillCustomerInformation(checkoutCustomer.firstName, checkoutCustomer.lastName, '');

    await checkoutPage.expectValidationError('Error: Postal Code is required');
  });

  test('user can sort products by price from low to high @ui @catalog', async ({ loggedInInventoryPage }) => {
    const inventoryPage = loggedInInventoryPage;
    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getVisiblePrices();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });
});
