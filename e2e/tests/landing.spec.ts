import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows the hero and primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Describe it\. Forge it\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start building free/i }).first()).toBeVisible();
  });

  test("toggles between light and dark mode", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: /toggle color theme/i });

    const initiallyDark = await html.evaluate((el) => el.classList.contains("dark"));
    await toggle.click();
    await expect(html).toHaveClass(initiallyDark ? /^(?!.*dark).*$/ : /dark/);
  });

  test("navigates to signup from the hero CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Start building free/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  });
});
