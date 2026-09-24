import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("renders the access experience without overflow or browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Access, without exposure." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A private way in." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("runs the compiled contract demo and rejects replay", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Just exploring? Try the local demo" })
    .click();
  await expect(page.getByText("Local session ready")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Verify demo access" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re on the list." }),
  ).toBeVisible();
  await expect(
    page.getByText("No transaction or zero-knowledge proof was generated.", {
      exact: false,
    }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  expect((await download).suggestedFilename()).toBe("veil-access-receipt.json");
  await page.getByRole("button", { name: "Test one-time protection" }).click();
  await expect(page.getByRole("alert")).toContainText("already been used");
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("explains missing wallets and restores focus after dialog closes", async ({
  page,
}) => {
  await page.goto("/");
  const button = page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .first();
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("No compatible wallet detected")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(button).toBeFocused();
});

test("handles wallet rejection without implying a successful connection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.midnight = {
      test: {
        name: "Test wallet",
        rdns: "test.wallet",
        icon: "",
        apiVersion: "4.0.1",
        connect: async () => {
          throw new Error("User rejected request");
        },
      },
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Test wallet/ }).click();
  await expect(page.getByRole("alert")).toContainText("declined");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByText("Not connected", { exact: true })).toBeVisible();
});

test("rejects wrong-network wallet responses", async ({ page }) => {
  await page.addInitScript(() => {
    window.midnight = {
      test: {
        name: "Test wallet",
        rdns: "test.wallet",
        icon: "",
        apiVersion: "4.0.1",
        connect: async () =>
          ({
            getConnectionStatus: async () => ({ status: "connected" }),
            getConfiguration: async () => ({ networkId: "mainnet" }),
          }) as never,
      },
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Test wallet/ }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Switch your Midnight wallet to Preview",
  );
});

test("supports deep-linked privacy and organizer views", async ({ page }) => {
  await page.goto("/#privacy");
  await expect(
    page.getByRole("heading", { name: "Less revealed. More protected." }),
  ).toBeVisible();
  await expect(
    page.getByText("Veil does not promise anonymity from that organizer.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.goto("/#organizer");
  await expect(
    page.getByRole("heading", { name: "Good company. Private access." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Connect wallet to begin" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter an event name");
  await page
    .getByRole("textbox", { name: "Event name" })
    .fill("Builders after dark");
  await page.getByRole("button", { name: "Connect wallet to begin" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("meets automated WCAG AA checks across primary views and the wallet dialog", async ({
  page,
}) => {
  for (const route of ["/#access", "/#privacy", "/#organizer"]) {
    await page.goto(route);
    await page.waitForTimeout(1000);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
