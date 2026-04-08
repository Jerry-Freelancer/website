# DocFlow MVP (Node.js)

这是一个支持 **WordPress 内容迁移** 的 Node.js MVP 网站。

## 本地运行

```bash
npm install
npm run dev
```

访问：
- 首页: http://localhost:3000
- 健康检查: http://localhost:3000/health
- 内容 API: http://localhost:3000/api/content

## 从旧 WordPress 复制内容

在可以访问旧站网络的环境运行：

```bash
node scripts/import-wordpress.js <wordpress-base-url>
```

例如：

```bash
node scripts/import-wordpress.js https://example.com/wordpress
```

脚本会通过 WordPress REST API 获取：
- `/wp-json/wp/v2/pages`
- `/wp-json/wp/v2/posts`

并生成 `content/site-content.json`，首页将自动读取并渲染。

## 使用 git clone 检查结果

```bash
git clone <你的仓库地址>
cd website
npm install
npm run dev
```


> 说明：前端保持既有视觉风格，只做内容迁移能力增强。

## Blog feature (like `/blogs`)

Open blog list:

- http://localhost:3000/blogs

Open one post:

- http://localhost:3000/blog?slug=welcome-to-docflow-blog

### How to write and publish a blog

1. Create a draft:

```bash
npm run blog:new -- "My New Blog Title"
```

2. Edit files generated under `content/blogs/`:

- `content/blogs/<slug>.json` (full content)
- `content/blogs/index.json` (list card metadata)

3. Publish it:

```bash
npm run blog:publish -- <slug>
```

4. Start server and verify:

```bash
npm run dev
```

Then open `/blogs`.

### How to upload

Use normal Git flow:

```bash
git add .
git commit -m "add new blog"
git push
```

After deployment, the new blog will be live.

## Markdown blog publishing

You can now publish Markdown directly (no third-party redirects).

### Markdown file format

Create a file under `content/blogs-md/` with front matter:

```md
---
slug: my-first-markdown-post
title: My First Markdown Post
author: Your Name
publishedAt: 2026-04-07
excerpt: One-line summary shown on /blogs
tags: mysql,performance
status: published
---

## Heading

Your markdown content here.
```

### Publish from an external markdown file

```bash
npm run blog:publish:md -- /path/to/your-post.md
```

Then open `http://localhost:3000/blogs`.
