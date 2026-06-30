import { expect, test } from '../fixtures/test';
import { checkoutCustomer, checkoutErrors } from '../support/checkout-data';
import { products } from '../support/products';
import type { CartPage } from './pages/cart.page';
import type { CheckoutPage } from './pages/checkout.page';
import type { InventoryPage } from './pages/inventory.page';

test.describe('SauceDemo shopping workflows', { tag: ['@ui'] }, () => {
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

  test('user can add and remove an item from the cart', { tag: ['@smoke', '@cart'] }, async ({
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

  test('user can complete checkout for selected products', { tag: ['@smoke', '@checkout'] }, async ({
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

  const requiredFieldCases = [
    {
      field: 'first name',
      firstName: '',
      lastName: checkoutCustomer.lastName,
      postalCode: checkoutCustomer.postalCode,
      error: checkoutErrors.firstNameRequired
    },
    {
      field: 'last name',
      firstName: checkoutCustomer.firstName,
      lastName: '',
      postalCode: checkoutCustomer.postalCode,
      error: checkoutErrors.lastNameRequired
    },
    {
      field: 'postal code',
      firstName: checkoutCustomer.firstName,
      lastName: checkoutCustomer.lastName,
      postalCode: '',
      error: checkoutErrors.postalCodeRequired
    }
  ];

  for (const testCase of requiredFieldCases) {
    test(`checkout requires ${testCase.field}`, { tag: ['@checkout', '@negative'] }, async ({
      loggedInInventoryPage,
      cartPage,
      checkoutPage
    }) => {
      await startCheckout(loggedInInventoryPage, cartPage, checkoutPage);

      await checkoutPage.fillCustomerInformation(testCase.firstName, testCase.lastName, testCase.postalCode);

      await checkoutPage.expectValidationError(testCase.error);
    });
  }

  test('user can sort products by price from low to high', { tag: ['@catalog'] }, async ({ loggedInInventoryPage }) => {
    const inventoryPage = loggedInInventoryPage;
    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getVisiblePrices();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });
});
