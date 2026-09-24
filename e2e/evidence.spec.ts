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
  await expect(page.getByText("27 passed", { exact: false })).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/test-output.png",
    fullPage: true,
  });
});
