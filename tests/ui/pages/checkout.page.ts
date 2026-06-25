import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async expectInformationStep(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
    await expect(this.page.locator('[data-test="title"]')).toHaveText('Checkout: Your Information');
  }

  async fillCustomerInformation(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.page.locator('[data-test="firstName"]').fill(firstName);
    await this.page.locator('[data-test="lastName"]').fill(lastName);
    await this.page.locator('[data-test="postalCode"]').fill(postalCode);
    await this.page.locator('[data-test="continue"]').click();
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(this.page.locator('[data-test="error"]')).toContainText(message);
  }

  async expectOverviewContains(itemName: string): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await expect(this.page.locator('[data-test="inventory-item-name"]').filter({ hasText: itemName })).toBeVisible();
    await expect(this.page.locator('[data-test="subtotal-label"]')).toBeVisible();
    await expect(this.page.locator('[data-test="tax-label"]')).toBeVisible();
    await expect(this.page.locator('[data-test="total-label"]')).toBeVisible();
  }

  async finish(): Promise<void> {
    await this.page.locator('[data-test="finish"]').click();
  }

  async expectComplete(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
  }
}
