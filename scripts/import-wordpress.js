const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2];

if (!baseUrl) {
  // eslint-disable-next-line no-console
  console.error('Usage: node scripts/import-wordpress.js <wordpress-base-url>');
  process.exit(1);
}

const normalize = (value) => value.replace(/\/$/, '');
const wpBase = normalize(baseUrl);
const outputPath = path.join(__dirname, '..', 'content', 'site-content.json');

const stripHtml = (html = '') =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function fetchAll(endpoint) {
  const first = await fetch(`${wpBase}${endpoint}`);
  if (!first.ok) {
    throw new Error(`Failed to fetch ${endpoint}: HTTP ${first.status}`);
  }

  const totalPages = Number(first.headers.get('x-wp-totalpages') || 1);
  const firstData = await first.json();
  const all = [...firstData];

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetch(`${wpBase}${endpoint}&page=${page}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${endpoint} page ${page}: HTTP ${res.status}`);
    }
    const data = await res.json();
    all.push(...data);
  }

  return all;
}

async function run() {
  const [pages, posts] = await Promise.all([
    fetchAll('/wp-json/wp/v2/pages?per_page=100'),
    fetchAll('/wp-json/wp/v2/posts?per_page=100')
  ]);

  const mappedPages = pages.map((p) => ({
    title: p?.title?.rendered || 'Untitled page',
    excerpt: stripHtml(p?.excerpt?.rendered || p?.content?.rendered || '')
  }));

  const mappedPosts = posts.map((p) => ({
    title: p?.title?.rendered || 'Untitled post',
    excerpt: stripHtml(p?.excerpt?.rendered || p?.content?.rendered || '')
  }));

  const next = {
    siteName: 'DocFlow',
    tagline: 'WordPress 内容迁移结果',
    heroTitle: '旧站内容已迁移到 Node.js MVP',
    heroDescription: `共迁移 ${mappedPages.length} 个页面、${mappedPosts.length} 篇文章。`,
    primaryCta: { label: '查看健康检查', href: '/health' },
    secondaryCta: { label: '查看内容 API', href: '/api/content' },
    sections: [
      {
        title: '迁移统计',
        items: [
          `页面数量：${mappedPages.length}`,
          `文章数量：${mappedPosts.length}`,
          '如需完整富文本渲染，可在下一步接入模板引擎'
        ]
      }
    ],
    pages: mappedPages,
    posts: mappedPosts
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Imported content written to ${outputPath}`);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
});
