const fs = require('fs');
const path = require('path');

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/publish-markdown.js <path-to-markdown-file>');
  process.exit(1);
}

const abs = path.resolve(source);
if (!fs.existsSync(abs)) {
  console.error(`File not found: ${abs}`);
  process.exit(1);
}

const targetDir = path.join(__dirname, '..', 'content', 'blogs-md');
const targetPath = path.join(targetDir, path.basename(abs));

const raw = fs.readFileSync(abs, 'utf8');
const withPublished = raw.includes('status:') ? raw.replace(/status:\s*draft/i, 'status: published') : raw;

fs.writeFileSync(targetPath, withPublished, 'utf8');
console.log(`Markdown blog published to: ${targetPath}`);
