# DocFlow MVP (Node.js)

一个基于 Node.js（原生 http 模块） 的网站 MVP，视觉风格参考 documentdb.io（深色渐变、卡片化模块、简洁 Hero 区域）。

## 本地运行

```bash
npm install
npm run dev
```

打开浏览器访问：

- http://localhost:3000
- 健康检查：http://localhost:3000/health

## 通过 `git clone` 检查结果

```bash
git clone <你的仓库地址>
cd website
npm install
npm run dev
```

如果你想在另一终端验证接口：

```bash
curl http://localhost:3000/health
```

预期返回：

```json
{"status":"ok"}
```
