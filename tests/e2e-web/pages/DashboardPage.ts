import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Dashboard Page Object Model (Operator Dashboard)
 */
export class DashboardPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly kpiCards: Locator;
  readonly slotCards: Locator;
  readonly addSlotButton: Locator;
  readonly notificationBadge: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByRole('heading', { name: /dashboard/i });
    this.kpiCards = page.getByTestId('kpi-card');
    this.slotCards = page.getByTestId('slot-card');
    this.addSlotButton = page.getByRole('button', { name: /add slot/i });
    this.notificationBadge = page.getByTestId('notification-badge');
    this.quickActions = page.getByTestId('quick-action');
  }

  async goto(): Promise<void> {
    await this.page.goto('/operator');
  }

  /**
   * Get KPI card count
   */
  async getKpiCardCount(): Promise<number> {
    return await this.kpiCards.count();
  }

  /**
   * Get KPI value by label
   */
  async getKpiValue(label: string): Promise<string> {
    const card = this.page.locator(`[data-testid="kpi-card"]:has-text("${label}")`);
    const value = card.locator('[data-testid="kpi-value"]');
    return await value.textContent() || '';
  }

  /**
   * Get number of slots displayed
   */
  async getSlotCount(): Promise<number> {
    return await this.slotCards.count();
  }

  /**
   * Click on a slot by index
   */
  async clickSlot(index: number): Promise<void> {
    await this.slotCards.nth(index).click();
  }

  /**
   * Click add slot button
   */
  async clickAddSlot(): Promise<void> {
    await this.addSlotButton.click();
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    const badge = await this.notificationBadge.textContent();
    return parseInt(badge || '0', 10);
  }

  /**
   * Click quick action by name
   */
  async clickQuickAction(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  /**
   * Wait for slots to load
   */
  async waitForSlotsToLoad(): Promise<void> {
    await this.page.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyStateVisible(): Promise<boolean> {
    const emptyState = this.page.getByText(/no availability slots/i);
    return await emptyState.isVisible();
  }

  /**
   * Refresh page data (pull to refresh simulation)
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForLoad();
  }
}
