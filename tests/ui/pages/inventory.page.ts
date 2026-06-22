import { expect, type Locator, type Page } from '@playwright/test';

export class InventoryPage {
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly sortSelect: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('[data-test="title"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.sortSelect = page.locator('[data-test="product-sort-container"]');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.title).toHaveText('Products');
  }

  itemByName(name: string): Locator {
    return this.page.locator('[data-test="inventory-item"]').filter({ hasText: name });
  }

  async addItem(name: string): Promise<void> {
    await this.itemByName(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeItem(name: string): Promise<void> {
    await this.itemByName(name).getByRole('button', { name: 'Remove' }).click();
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toHaveCount(0);
      return;
    }

    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart(): Promise<void> {
    await this.page.locator('[data-test="shopping-cart-link"]').click();
  }

  async sortBy(optionValue: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortSelect.selectOption(optionValue);
  }

  async getVisiblePrices(): Promise<number[]> {
    const prices = await this.page.locator('[data-test="inventory-item-price"]').allTextContents();
    return prices.map((price) => Number(price.replace('$', '')));
  }
}
