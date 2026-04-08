const fs = require('fs');
const path = require('path');

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: node scripts/new-blog.js "Your Blog Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const blogsDir = path.join(__dirname, '..', 'content', 'blogs');
const postPath = path.join(blogsDir, `${slug}.json`);
const indexPath = path.join(blogsDir, 'index.json');

if (fs.existsSync(postPath)) {
  console.error(`Post already exists: ${postPath}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const draftPost = {
  slug,
  title,
  author: 'Your Name',
  publishedAt: today,
  status: 'draft',
  tags: ['database'],
  content: ['Write your first paragraph here.']
};

fs.writeFileSync(postPath, `${JSON.stringify(draftPost, null, 2)}\n`, 'utf8');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
index.unshift({
  slug,
  title,
  excerpt: 'Add a short summary for this post.',
  author: 'Your Name',
  publishedAt: today,
  tags: ['database'],
  status: 'draft'
});
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

console.log(`Draft created:\n- ${postPath}\n- ${indexPath}`);
