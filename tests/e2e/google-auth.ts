import { expect, type Locator, type Page } from "@playwright/test";

const googleTestEmail = process.env.GOOGLE_TEST_EMAIL;
const googleTestPassword = process.env.GOOGLE_TEST_PASSWORD;

export const hasGoogleTestCredentials = Boolean(googleTestEmail && googleTestPassword);

async function isVisible(locator: Locator, timeout = 3000) {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickIfVisible(page: Page, selectors: Array<string | RegExp>) {
  for (const selector of selectors) {
    const locator =
      typeof selector === "string"
        ? page.getByText(selector, { exact: false })
        : page.getByRole("button", { name: selector });

    if (await isVisible(locator, 2000)) {
      await locator.click();
      return true;
    }
  }

  return false;
}

export async function signInWithGoogle(page: Page, expectedPath: string) {
  if (!googleTestEmail || !googleTestPassword) {
    throw new Error("Missing GOOGLE_TEST_EMAIL / GOOGLE_TEST_PASSWORD");
  }

  await page.goto("/sign-in");
  await page.getByRole("button", { name: /Googleでログイン/i }).click();

  if (await isVisible(page.getByText(/別のアカウントを使用|Use another account/i), 3000)) {
    await page.getByText(/別のアカウントを使用|Use another account/i).click();
  }

  const emailChoice = page.getByText(googleTestEmail, { exact: false });
  if (await isVisible(emailChoice, 3000)) {
    await emailChoice.click();
  } else {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible", timeout: 30000 });
    await emailInput.fill(googleTestEmail);
    await clickIfVisible(page, [/次へ/i, /Next/i]);
  }

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 30000 });
  await passwordInput.fill(googleTestPassword);
  await clickIfVisible(page, [/次へ/i, /Next/i]);

  if (page.url().includes("accounts.google.com")) {
    await clickIfVisible(page, [/続行/i, /Continue/i, /許可/i, /Allow/i, /同意/i]);
  }

  await page.waitForURL(
    (url) => !url.hostname.includes("accounts.google.com") && url.pathname.startsWith(expectedPath),
    { timeout: 90000 },
  );

  await expect(page).toHaveURL(new RegExp(expectedPath));
}
