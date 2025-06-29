import { appendFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

export async function registerUrlToNotebookLM(url: string) {
  // Launch browser with Google login workarounds
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false", // Default true, set PLAYWRIGHT_HEADLESS=false to show browser
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  // Create context with proper user agent and viewport
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: "ja-JP",
    // Use saved authentication state if available
    storageState: process.env.PLAYWRIGHT_AUTH_FILE ? process.env.PLAYWRIGHT_AUTH_FILE : undefined,
  });

  const page = await context.newPage();

  // Remove automation indicators
  await page.addInitScript(() => {
    // @ts-ignore
    delete window.navigator.__proto__.webdriver;
  });

  // Navigate to NotebookLM
  await page.goto("https://notebooklm.google.com/");

  // Click on "新規作成" button
  await page.locator('button[aria-label="ノートブックを新規作成"]').click();

  // Click on "ウェブサイト" chip
  await page.locator('mat-chip:has-text("ウェブサイト")').click();

  // Find and fill the URL input field with label "URL を貼り付け"
  await page.getByLabel("URL を貼り付け").fill(url);

  // Click on "挿入" button
  await page.getByRole("button", { name: "挿入" }).click();

  // Close browser
  await browser.close();
}

export async function saveFailedUrl(url: string, error: Error | unknown) {
  const backupPath = join("./tmp", "backup.txt");
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const backupEntry = `${timestamp}\t${url}\t${errorMessage}\n`;

  await appendFile(backupPath, backupEntry);
}

export async function getFailedUrls() {
  const backupPath = join("./tmp", "backup.txt");

  try {
    const content = await readFile(backupPath, "utf-8");
    const lines = content
      .trim()
      .split("\n")
      .filter((line) => line);
    const entries = lines.map((line) => {
      const [timestamp, url, error] = line.split("\t");
      return { timestamp, url, error };
    });

    return {
      count: entries.length,
      entries: entries,
    };
  } catch (_error) {
    return {
      count: 0,
      entries: [],
      message: "No backup file found",
    };
  }
}
