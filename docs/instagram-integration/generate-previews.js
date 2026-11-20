const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const htmlSourcePath = path.join(rootDir, 'guide-source.html');
const previewsDir = path.join(rootDir, 'previews');
const tmpProfileDir = path.join(rootDir, 'tmp_chrome_build');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const html = fs.readFileSync(htmlSourcePath, 'utf8');

// Extract all <div class="doc-page...">...</div>
// We can split by `<div class="doc-page`
const headMatch = html.match(/<head>[\s\S]*?<\/head>/);
const head = headMatch ? headMatch[0] : '';

// Find all doc-page blocks
const pages = [];
const regex = /<div class="doc-page[\s\S]*?(?=<div class="doc-page|<\/body>)/g;
let m;
while ((m = regex.exec(html)) !== null) {
  pages.push(m[0].trim());
}

console.log(`Found ${pages.length} pages to preview.`);

// Select key milestone pages to render for visual inspection:
// 1 (Cover), 2 (TOC), 3 (Ch 1 + Diagram 1), 4 (Ch 2 + Diagram 2), 7 (Ch 5 + Diagram 4), 8 (Ch 6 + Diagram 3), 11 (Ch 9 + Diagram 6), 17 (Ch 15 + Diagram 9), 21 (Ch 19 Prompt)
const keyPages = [1, 2, 3, 4, 7, 8, 11, 14, 17, 19, 21, 23];

for (const pNum of keyPages) {
  const pageIdx = pNum - 1;
  if (!pages[pageIdx]) continue;

  const pageHtml = `<!DOCTYPE html>
<html>
${head}
<body style="background:#ffffff; margin:0; padding:0;">
${pages[pageIdx]}
</body>
</html>`;

  const pageHtmlPath = path.join(previewsDir, `page-${pNum}.html`);
  const pagePngPath = path.join(previewsDir, `page-${pNum}.png`);
  fs.writeFileSync(pageHtmlPath, pageHtml, 'utf8');

  const fileUrl = 'file:///' + pageHtmlPath.replace(/\\/g, '/');
  // A4 aspect ratio at 1200px width is 1200 x 1697
  const cmd = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --user-data-dir="${tmpProfileDir}" --screenshot="${pagePngPath}" --window-size=1200,1697 "${fileUrl}"`;
  try {
    execSync(cmd);
    console.log(`Rendered Page ${pNum} preview -> page-${pNum}.png (${fs.statSync(pagePngPath).size} bytes)`);
  } catch (err) {
    console.error(`Failed to render page ${pNum}:`, err.message);
  }
}

console.log('Key page previews generated!');
