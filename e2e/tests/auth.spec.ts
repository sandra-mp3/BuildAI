import { expect, test } from "@playwright/test";

test.describe("Authentication (no Firebase project connected — simulated flows)", () => {
  test("redirects unauthenticated users away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs up with email in demo mode and reaches the dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Test Builder");
    await page.getByLabel("Email").fill(`test-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Your projects/i })).toBeVisible();
  });

  test("a freshly created account starts with an empty project list", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Fresh Builder");
    await page.getByLabel("Email").fill(`fresh-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/no projects yet/i)).toBeVisible();
  });

  test("Demo Mode loads the sample workspace with a visible warning", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /demo mode/i }).click();
    await expect(page.getByRole("heading", { name: /enter demo mode/i })).toBeVisible();
    await expect(page.getByText(/nothing is saved/i)).toBeVisible();
    await page.getByRole("button", { name: /continue to demo/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/demo mode/i).first()).toBeVisible();
  });
});
