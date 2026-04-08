const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/publish-blog.js <slug>');
  process.exit(1);
}

const blogsDir = path.join(__dirname, '..', 'content', 'blogs');
const postPath = path.join(blogsDir, `${slug}.json`);
const indexPath = path.join(blogsDir, 'index.json');

if (!fs.existsSync(postPath)) {
  console.error(`Post not found: ${postPath}`);
  process.exit(1);
}

const post = JSON.parse(fs.readFileSync(postPath, 'utf8'));
post.status = 'published';
if (!post.publishedAt) post.publishedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`, 'utf8');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const item = index.find((x) => x.slug === slug);
if (item) {
  item.status = 'published';
  if (!item.publishedAt) item.publishedAt = post.publishedAt;
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
}

console.log(`Published: ${slug}`);
