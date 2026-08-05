import { expect, test, type Page } from "@playwright/test"

async function login(page: Page, email: string) {
  await page.goto("/en/login")
  await page.getByLabel("Email").pressSequentially(email)
  await page.getByLabel("Password").pressSequentially("Portfolio123!")
  await page.getByRole("button", { name: "Log in" }).click()
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop concept comparison")
})

test("capture landing concept comparison", async ({ page }) => {
  await page.goto("/en")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await page.screenshot({ path: "test-results/visuals/landing.png", fullPage: true })
})

test("capture student dashboard concept comparison", async ({ page }) => {
  await login(page, "student@demo.portfoliopath.example.com")
  await expect(page).toHaveURL(/\/en\/student\/dashboard/, { timeout: 15_000 })
  await page.screenshot({ path: "test-results/visuals/student-dashboard.png", fullPage: true })
})

test("capture counselor dashboard concept comparison", async ({ page }) => {
  await login(page, "counselor@demo.portfoliopath.example.com")
  await expect(page).toHaveURL(/\/en\/counselor\/dashboard/, { timeout: 15_000 })
  await page.screenshot({ path: "test-results/visuals/counselor-dashboard.png", fullPage: true })
})
