import { createServer } from 'node:http';
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, 'dist');
const assetsDir = join(root, 'docs', 'assets');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
};

async function findBrowserExecutable() {
  const candidates = [
    process.env.ANNA_CHROME_EXECUTABLE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      await stat(p);
      return p;
    } catch {
      // continue
    }
  }
  return undefined;
}

function startStaticServer(baseDir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const cleanUrl = (req.url || '/').split('?')[0];
        const rel = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
        const filePath = join(baseDir, rel);
        const body = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function main() {
  await mkdir(assetsDir, { recursive: true });
  const executablePath = await findBrowserExecutable();
  const { server, url } = await startStaticServer(distDir);

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // 1. Render 512x512 PNG Logo from public/app-icon.svg
    const svgContent = await readFile(join(root, 'public', 'app-icon.svg'), 'utf8');
    const iconPage = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
    await iconPage.setContent(
      `<!doctype html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;">${svgContent}</body></html>`,
    );
    const iconPath = join(root, 'public', 'app-icon-512.png');
    await iconPage.screenshot({ path: iconPath, omitBackground: true });
    await copyFile(iconPath, join(root, 'anna-app', 'bundle', 'app-icon-512.png'));
    await iconPage.close();

    // 2. Render 1280x640 Social Cover Banner
    const coverPage = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
    await coverPage.setContent(`<!doctype html>
      <html>
      <head>
        <style>
          body {
            margin: 0; width: 1280px; height: 640px; overflow: hidden;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #0f766e 100%);
            color: #f8fafc; display: flex; align-items: center; justify-content: space-between;
            padding: 0 84px; box-sizing: border-box;
          }
          .left { max-width: 680px; }
          .pill {
            display: inline-block; padding: 8px 16px; border-radius: 999px;
            background: rgba(45, 212, 191, 0.16); border: 1px solid rgba(45, 212, 191, 0.45);
            color: #5eead4; font-weight: 700; font-size: 15px; margin-bottom: 22px;
          }
          h1 { margin: 0 0 16px 0; font-size: 62px; line-height: 1.08; letter-spacing: -0.025em; }
          p { margin: 0 0 28px 0; font-size: 23px; line-height: 1.45; color: #cbd5e1; }
          .tags { display: flex; gap: 12px; flex-wrap: wrap; }
          .tag {
            padding: 10px 16px; border-radius: 10px; background: rgba(15, 23, 42, 0.55);
            border: 1px solid rgba(148, 163, 184, 0.25); font-size: 16px; font-weight: 600; color: #e2e8f0;
          }
          .card {
            width: 360px; padding: 32px; border-radius: 28px;
            background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(56, 189, 248, 0.3);
            box-shadow: 0 24px 60px rgba(0,0,0,0.45); text-align: center;
          }
          .ring {
            width: 156px; height: 156px; border-radius: 50%; margin: 0 auto 20px auto;
            border: 14px solid #2dd4bf; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
          }
          .num { font-size: 52px; font-weight: 800; color: #ffffff; line-height: 1; }
          .lbl { font-size: 15px; color: #5eead4; font-weight: 700; margin-top: 4px; }
          .row { display: flex; justify-content: space-between; font-size: 15px; padding: 8px 0; border-top: 1px solid rgba(148,163,184,0.18); color: #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="left">
          <div class="pill">Open-Source · Built for Anna AI OS</div>
          <h1>RoleFit Studio</h1>
          <p>AI-native ATS skill-gap scoring, live company intelligence &amp; hallucination-free XYZ resume bullet tailoring.</p>
          <div class="tags">
            <span class="tag">0–100 Weighted ATS Score</span>
            <span class="tag">Google XYZ Bullet Diffs</span>
            <span class="tag">Live Company Web Intel</span>
          </div>
        </div>
        <div class="card">
          <div class="ring">
            <span class="num">88</span>
            <span class="lbl">Strong Fit</span>
          </div>
          <div class="row"><span>Hard Skills &amp; Stack</span><strong>92%</strong></div>
          <div class="row"><span>Must-Have Coverage</span><strong>86%</strong></div>
          <div class="row"><span>XYZ Impact Score</span><strong>84%</strong></div>
        </div>
      </body>
      </html>`);
    await coverPage.screenshot({ path: join(assetsDir, 'social-cover.png') });
    await coverPage.close();

    // 3. Desktop Screenshots (1280x840)
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 840 }, deviceScaleFactor: 1 });
    await desktopPage.goto(url, { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: join(assetsDir, 'app-desktop-en.png') });

    await desktopPage.click('#runAnalyzeBtn');
    await desktopPage.click('#tabBtnBullets');
    await desktopPage.waitForTimeout(250);
    await desktopPage.screenshot({ path: join(assetsDir, 'app-bullets-en.png') });
    await desktopPage.close();

    // 4. Mobile Screenshot (390x844) + Strict 320x568 Review Audit
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await mobilePage.goto(url, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: join(assetsDir, 'app-mobile-en.png') });

    await mobilePage.setViewportSize({ width: 320, height: 568 });
    await mobilePage.waitForTimeout(150);
    const audit = await mobilePage.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const buttons = [...document.querySelectorAll('button:not(.hidden)')].filter(
        (b) => b.offsetParent !== null,
      );
      const undersized = buttons
        .map((b) => ({ id: b.id || b.textContent.trim().slice(0, 20), w: b.offsetWidth, h: b.offsetHeight }))
        .filter((b) => b.w < 44 || b.h < 44);
      return { overflow, buttonCount: buttons.length, undersized };
    });
    await mobilePage.close();

    if (audit.overflow > 1) {
      throw new Error(`Mobile 320px horizontal overflow detected: +${audit.overflow}px`);
    }
    if (audit.undersized.length > 0) {
      throw new Error(`Mobile touch-target < 44px detected: ${JSON.stringify(audit.undersized)}`);
    }

    console.log('Generated all PNG assets & passed 320px mobile review checks:', audit);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
