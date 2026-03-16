import { test } from "@playwright/test";
import { hasGoogleAuthState, signInWithGoogle } from "./google-auth";

test.describe("tabi_note auth sanity", () => {
  test.skip(!hasGoogleAuthState, "Google auth storage state is not configured");

  test("auth state can reach /app", async ({ page }) => {
    await signInWithGoogle(page, "/app");
  });
});
