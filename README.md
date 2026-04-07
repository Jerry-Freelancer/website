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
