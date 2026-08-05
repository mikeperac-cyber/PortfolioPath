import { expect, test, type Page } from "@playwright/test"

async function login(page: Page, email: string) {
  await page.goto("/en/login")
  await page.getByLabel("Email").pressSequentially(email)
  await page.getByLabel("Password").pressSequentially("Portfolio123!")
  await page.getByRole("button", { name: "Log in" }).click()
}

test("student reaches the protected evidence-first dashboard", async ({ page }) => {
  await login(page, "student@demo.portfoliopath.example.com")
  await expect(page).toHaveURL(/\/en\/student\/dashboard/, { timeout: 15_000 })
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good afternoon")
  await expect(page.getByText("Portfolio readiness")).toBeVisible()
})

test("approved counselor reaches only the counselor review workspace", async ({ page }) => {
  await login(page, "counselor@demo.portfoliopath.example.com")
  await expect(page).toHaveURL(/\/en\/counselor\/dashboard/, { timeout: 15_000 })
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Review what needs judgment.")
  await expect(page.getByText("Review queue")).toBeVisible()
})

test("administrator reaches the minimal audited console", async ({ page }) => {
  await login(page, "admin@demo.portfoliopath.example.com")
  await expect(page).toHaveURL(/\/en\/admin\/dashboard/, { timeout: 15_000 })
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Platform overview")
  await expect(page.getByText("Security posture")).toBeVisible()
})
