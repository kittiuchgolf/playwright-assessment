import { expect, test } from '../fixtures/test';
import { checkoutCustomer } from '../support/checkout-data';
import { products } from '../support/products';

test.describe('SauceDemo shopping workflows', () => {
  test('user can add and remove an item from the cart', async ({ loggedInInventoryPage, cartPage }) => {
    const inventoryPage = loggedInInventoryPage;
    await inventoryPage.addItem(products.backpack);
    await inventoryPage.expectCartCount(1);
    await inventoryPage.openCart();
    await cartPage.expectLoaded();
    await cartPage.expectItemVisible(products.backpack);

    await cartPage.removeItem(products.backpack);

    await cartPage.expectCartEmpty();
  });

  test('user can complete checkout for selected products', async ({
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

  test('user can sort products by price from low to high', async ({ loggedInInventoryPage }) => {
    const inventoryPage = loggedInInventoryPage;
    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getVisiblePrices();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });
});
