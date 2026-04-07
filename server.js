const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const contentPath = path.join(__dirname, 'content', 'site-content.json');
const blogsDir = path.join(__dirname, 'content', 'blogs');
const markdownBlogsDir = path.join(__dirname, 'content', 'blogs-md');

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};

const sendFile = (res, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 500, { error: 'failed_to_read_file' });
      return;
    }

    const ext = path.extname(filePath);
    const contentType =
      ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : 'text/plain; charset=utf-8';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const readJsonFile = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_err) {
    return fallback;
  }
};

const parseFrontMatter = (raw) => {
  if (!raw.startsWith('---')) return { meta: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: raw };

  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const meta = {};

  block.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key === 'tags') {
      meta.tags = value.split(',').map((x) => x.trim()).filter(Boolean);
    } else {
      meta[key] = value;
    }
  });

  return { meta, body };
};

const markdownToHtml = (markdown) => {
  const converted = markdown
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  return converted
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => (block.startsWith('<h1') || block.startsWith('<h2') || block.startsWith('<h3') ? block : `<p>${block}</p>`))
    .join('');
};

const slugFromFile = (file) => file.replace(/\.md$/, '');

const listMarkdownBlogs = () => {
  let files = [];
  try {
    files = fs.readdirSync(markdownBlogsDir).filter((x) => x.endsWith('.md'));
  } catch (_err) {
    return [];
  }

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(markdownBlogsDir, file), 'utf8');
      const { meta } = parseFrontMatter(raw);
      const slug = meta.slug || slugFromFile(file);
      return {
        slug,
        title: meta.title || slug,
        excerpt: meta.excerpt || '',
        author: meta.author || 'Unknown',
        publishedAt: meta.publishedAt || '',
        tags: meta.tags || [],
        status: meta.status || 'draft',
        format: 'markdown'
      };
    })
    .filter((x) => x.status === 'published');
};

const listJsonBlogs = () => {
  const index = readJsonFile(path.join(blogsDir, 'index.json'), []);
  return index.filter((x) => x.status === 'published');
};

const listPublishedBlogs = () => {
  const markdown = listMarkdownBlogs();
  const json = listJsonBlogs();
  return [...markdown, ...json].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
};

const readMarkdownBlogPost = (slug) => {
  if (!slug || /[^a-z0-9-]/.test(slug)) return null;
  const filePath = path.join(markdownBlogsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  return {
    slug,
    title: meta.title || slug,
    author: meta.author || 'Unknown',
    publishedAt: meta.publishedAt || '',
    status: meta.status || 'draft',
    tags: meta.tags || [],
    contentHtml: markdownToHtml(body),
    format: 'markdown'
  };
};

const readJsonBlogPost = (slug) => {
  if (!slug || /[^a-z0-9-]/.test(slug)) return null;
  const filePath = path.join(blogsDir, `${slug}.json`);
  return readJsonFile(filePath, null);
};

const readBlogPost = (slug) => readMarkdownBlogPost(slug) || readJsonBlogPost(slug);

const readContent = () => {
  try {
    const raw = fs.readFileSync(contentPath, 'utf8');
    return JSON.parse(raw);
  } catch (_err) {
    return { error: 'content_unavailable' };
  }
};

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.url === '/api/content') {
    sendJson(res, 200, readContent());
    return;
  }

  if (req.url === '/api/blogs') {
    sendJson(res, 200, listPublishedBlogs());
    return;
  }

  if (req.url.startsWith('/api/blogs/')) {
    const slug = req.url.replace('/api/blogs/', '').split('?')[0];
    const post = readBlogPost(slug);
    if (!post || post.status !== 'published') {
      sendJson(res, 404, { error: 'blog_not_found' });
      return;
    }
    sendJson(res, 200, post);
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    sendFile(res, path.join(publicDir, 'index.html'));
    return;
  }

  if (req.url === '/about-me' || req.url === '/about-me.html') {
    sendFile(res, path.join(publicDir, 'about-me.html'));
    return;
  }

  if (req.url === '/blogs' || req.url === '/blogs.html') {
    sendFile(res, path.join(publicDir, 'blogs.html'));
    return;
  }

  if (req.url.startsWith('/blog')) {
    sendFile(res, path.join(publicDir, 'blog.html'));
    return;
  }

  if (req.url === '/support-postgresql' || req.url === '/support-postgresql.html') {
    sendFile(res, path.join(publicDir, 'support-postgresql.html'));
    return;
  }

  if (req.url === '/support-mysql-mariadb' || req.url === '/support-mysql-mariadb.html') {
    sendFile(res, path.join(publicDir, 'support-mysql-mariadb.html'));
    return;
  }

  if (req.url === '/support-mongodb' || req.url === '/support-mongodb.html') {
    sendFile(res, path.join(publicDir, 'support-mongodb.html'));
    return;
  }
  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MVP site is running on http://localhost:${PORT}`);
});
