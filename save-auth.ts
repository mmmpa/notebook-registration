import { chromium } from "playwright";

// Script to save authentication state after manual login
async function saveAuth() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: "ja-JP",
  });

  const page = await context.newPage();

  // Remove automation indicators
  await page.addInitScript(() => {
    // @ts-ignore
    delete window.navigator.__proto__.webdriver;
  });

  console.log("Opening Google login page...");
  await page.goto("https://accounts.google.com");

  console.log("Please login manually.");
  console.log("After logging in, navigate to https://notebooklm.google.com to ensure access.");
  console.log("Press Enter when done...");

  // Wait for user to complete login
  await new Promise((resolve) => {
    process.stdin.once("data", resolve);
  });

  // Save authentication state
  await context.storageState({ path: "tmp/auth.json" });
  console.log("Authentication state saved to tmp/auth.json");

  await browser.close();
}

saveAuth().catch(console.error);
