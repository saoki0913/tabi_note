import { test, expect } from "@playwright/test";

test.describe("tabi_note smoke", () => {
  test("ランディングページが表示される", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("サインインページが表示される", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("料金ページが表示される", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
});
