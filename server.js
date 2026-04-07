const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const contentPath = path.join(__dirname, 'content', 'site-content.json');

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


const blogsDir = path.join(__dirname, 'content', 'blogs');

const readJsonFile = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_err) {
    return fallback;
  }
};

const listPublishedBlogs = () => {
  const index = readJsonFile(path.join(blogsDir, 'index.json'), []);
  return index.filter((x) => x.status === 'published');
};

const readBlogPost = (slug) => {
  if (!slug || /[^a-z0-9-]/.test(slug)) return null;
  const filePath = path.join(blogsDir, `${slug}.json`);
  return readJsonFile(filePath, null);
};

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
