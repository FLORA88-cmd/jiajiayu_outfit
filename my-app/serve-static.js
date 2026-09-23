// serve-static.js —— 零依赖静态文件服务（Day 8）
// 用途：本地打开 my-app/public 里的 mock 数据版主视图
// 端口 5173，与 Day 7 的真实数据版（3000 端口）互不干扰
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5173;
const ROOT = path.join(__dirname, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer((req, res) => {
  let file = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(ROOT, file);
  // 防目录穿越：只允许读 public 目录内的文件
  if (!full.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("找不到这个文件"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(full)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`mock 数据版主视图已启动：http://localhost:${PORT}`);
});
