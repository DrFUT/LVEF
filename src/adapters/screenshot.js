import fs from 'node:fs/promises';
import path from 'node:path';

async function validImage(file) {
  try {
    const stat = await fs.stat(file);
    return stat.isFile() && stat.size > 100;
  } catch {
    return false;
  }
}

export async function captureBrowserPage({ url, outputPath, engine = 'playwright', selector }) {
  if (engine !== 'playwright') {
    return { status: 'BLOCKED', reason: `unsupported browser screenshot engine: ${engine}` };
  }
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (error) {
    return { status: 'BLOCKED', reason: `Playwright unavailable: ${error.message}` };
  }
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    if (selector) await page.locator(selector).screenshot({ path: outputPath });
    else await page.screenshot({ path: outputPath, fullPage: true });
    await browser.close();
    if (!(await validImage(outputPath))) return { status: 'FAIL', reason: 'screenshot file is empty or invalid' };
    return { status: 'PASS', type: 'browser', path: outputPath, url };
  } catch (error) {
    return { status: 'BLOCKED', type: 'browser', reason: error.message, url };
  }
}
