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
    tagline: 'WordPress Migration Result',
    heroTitle: 'Legacy site content migrated to Node.js MVP',
    heroDescription: `Migrated ${mappedPages.length} pages and ${mappedPosts.length} posts.`,
    primaryCta: { label: 'Check API Health', href: '/health' },
    secondaryCta: { label: 'View Content API', href: '/api/content' },
    capabilities: {
      label: 'CAPABILITIES',
      heading: 'Core database services for production workloads',
      subheading: 'From troubleshooting to architecture, delivered by senior database specialists.',
      cards: [
        {
          eyebrow: 'SUPPORT',
          title: '24×7 Database Support',
          description: 'Resolve issues faster and keep databases and extensions healthy with continuous consultative support.',
          tags: ['24×7', 'Incident response'],
          linkLabel: 'Contact support',
          linkHref: '/about-me'
        },
        {
          eyebrow: 'MANAGED SERVICES',
          title: 'Proactive DBA Management',
          description: 'Offload round-the-clock monitoring, maintenance, and optimization at a fraction of full-time DBA cost.',
          tags: ['Monitoring', 'Cost efficient'],
          linkLabel: 'Explore managed services',
          linkHref: '/about-me'
        },
        {
          eyebrow: 'CONSULTING',
          title: 'Performance & Architecture',
          description: 'Solve complex query bottlenecks and design resilient, scalable database architectures with expert guidance.',
          tags: ['Performance', 'Design review'],
          linkLabel: 'Talk to an expert',
          linkHref: '/about-me'
        },
        {
          eyebrow: 'TRAINING',
          title: 'Hands-on Team Enablement',
          description: 'Upskill teams with instructor-led, practical training sessions delivered remotely or onsite.',
          tags: ['Instructor-led', 'Onsite or remote'],
          linkLabel: 'View training options',
          linkHref: '/about-me'
        }
      ]
    },
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
