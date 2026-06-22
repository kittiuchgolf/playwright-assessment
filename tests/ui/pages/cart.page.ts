import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('[data-test="title"]');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/cart\.html/);
    await expect(this.title).toHaveText('Your Cart');
  }

  async expectItemVisible(name: string): Promise<void> {
    await expect(this.page.locator('[data-test="inventory-item-name"]', { hasText: name })).toBeVisible();
  }

  async removeItem(name: string): Promise<void> {
    const item = this.page.locator('[data-test="cart-list"] [data-test="inventory-item"]').filter({ hasText: name });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async expectCartEmpty(): Promise<void> {
    await expect(this.page.locator('[data-test="cart-list"] [data-test="inventory-item"]')).toHaveCount(0);
  }

  async checkout(): Promise<void> {
    await this.page.locator('[data-test="checkout"]').click();
  }
}
