import { expect, test } from "@playwright/test";
import { hasGoogleAuthState, signInWithGoogle } from "./google-auth";

test.describe("tabi_note Google major flow", () => {
  test.skip(!hasGoogleAuthState, "Google auth storage state is not configured");

  test("Google login後に主要画面と主要APIが使える", async ({ page }) => {
    const request = page.context().request;
    const runId = Date.now().toString(36);
    const now = new Date().toISOString();
    const tripId = `e2e-${runId}`;
    const tripTitle = `E2E Trip ${runId}`;

    await signInWithGoogle(page, "/app");
    await expect(page.locator("body")).toContainText(/保存|プレミアム|Pricing|booklet/i);

    const saveResponse = await request.post("/api/booklets", {
      data: {
        action: "save",
        trip: {
          id: tripId,
          title: tripTitle,
          destination: "Tokyo",
          startDate: "2026-03-20",
          endDate: "2026-03-21",
          transportText: "Shinkansen",
          notes: "E2E validation trip",
          members: [{ id: `member-${runId}`, name: "E2E Tester" }],
          lodgings: [],
          wantItems: [],
          dayPlans: [{ day: 1, date: "2026-03-20", activities: ["Asakusa", "Skytree"] }],
          templateType: "minimal",
          formatType: "classic",
          aiEnabled: false,
          aiTone: "casual",
          status: "draft",
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    expect(saveResponse.ok()).toBeTruthy();
    const savePayload = (await saveResponse.json()) as { trip: { id: string; title: string } };

    await page.goto(`/app?booklet=${savePayload.trip.id}`);
    await expect(page.locator("body")).toContainText(tripTitle);

    const shareResponse = await request.post(`/api/booklets/${savePayload.trip.id}/share`);
    expect([200, 402]).toContain(shareResponse.status());
    if (shareResponse.status() === 200) {
      const sharePayload = (await shareResponse.json()) as { shareUrl: string };
      expect(sharePayload.shareUrl).toContain("/share/");
      const sharePage = await page.context().newPage();
      const response = await sharePage.goto(sharePayload.shareUrl);
      expect(response?.ok()).toBeTruthy();
      await sharePage.close();
    }

    await page.goto("/pricing");
    await expect(page.locator("body")).toContainText(/Premium|月額|年額/i);

    const checkoutResponse = await request.post("/api/billing/checkout", {
      data: { billingCycle: "monthly" },
    });
    expect(checkoutResponse.ok()).toBeTruthy();
    const checkoutPayload = (await checkoutResponse.json()) as { url: string };
    expect(checkoutPayload.url).toContain("checkout.stripe.com");

    const stripePage = await page.context().newPage();
    await stripePage.goto(checkoutPayload.url, { waitUntil: "domcontentloaded" });
    await expect(stripePage).toHaveURL(/checkout\.stripe\.com/);
    await stripePage.close();
  });
});
