import { test, expect } from "@playwright/test";

test("captures the actual unit test output for the submission", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.CAPTURE_EVIDENCE || testInfo.project.name !== "desktop",
    "Evidence capture is an explicit local command.",
  );
  await page.goto("/evidence/test-output.html");
  await expect(
    page.getByRole("heading", { name: "Contract & application tests" }),
  ).toBeVisible();
  const output = await page.locator("pre").innerText();
  const passed = output.match(/Tests\s+(\d+) passed/);
  expect(
    passed,
    "The captured output must contain a passing Vitest summary",
  ).not.toBeNull();
  expect(Number(passed![1])).toBeGreaterThanOrEqual(3);
  await page.screenshot({
    path: "docs/evidence/test-output.png",
    fullPage: true,
  });
});
