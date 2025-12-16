import { test, expect } from "@playwright/test";

test.describe("Auth guards", () => {
  test.skip(process.env.E2E_SKIP === "1", "E2E_SKIP=1");

  test("unauthenticated user is redirected to login from protected routes", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/login/);
  });

  test("logout redirects to login", async ({ page }) => {
    test.skip(true, "Requires authenticated session setup");
    await page.goto("/app");
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
