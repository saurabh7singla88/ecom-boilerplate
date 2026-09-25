import { expect, test } from "@playwright/test";

// Requires a seeded database (`pnpm db:seed`).
test("browse from the catalog to a product page", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1, name: "All products" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Categories" })
    .getByRole("link", { name: "Apparel" })
    .click();
  await expect(page).toHaveURL(/category=apparel/);
  await expect(page.getByRole("heading", { level: 1, name: "Apparel" })).toBeVisible();

  await page.getByRole("link", { name: /Classic Cotton Kurta/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Classic Cotton Kurta" })).toBeVisible();
  await expect(page.getByText("Inclusive of GST")).toBeVisible();
});

test("unknown products show a 404", async ({ page }) => {
  const response = await page.goto("/products/does-not-exist");
  expect(response?.status()).toBe(404);
});
