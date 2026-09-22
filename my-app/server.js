// server.js —— 佳佳雨的穿搭 · 后端（Day 7）
// 技术路线（TECH_DESIGN.md）：原生 HTML/CSS/JS + Node/Express + SQLite
// 数据流：表单 → Express 校验 → SQLite；读取时反向
const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const app = express();
const PORT = 3000;

// ===== 数据库初始化（单文件 my-app/data.db，随项目走）=====
// .gitignore 已忽略 *.db，数据库文件不会进仓库
const db = new DatabaseSync(path.join(__dirname, "data.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS outfits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,      -- 昵称（必填）
    top_item TEXT NOT NULL,      -- 上衣（必填）
    bottom_item TEXT NOT NULL,   -- 裤子（必填）
    note TEXT,                   -- 搭配心得（选填）
    created_at TEXT NOT NULL     -- 发布时间
  )
`);

// ===== 中间件 =====
app.use(express.urlencoded({ extended: true })); // 读懂表单数据

// ===== 小工具 =====
// 转义 HTML 特殊字符，防止内容里的 <> 破坏页面结构
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
// 时间显示格式：2026-09-22 21:20
function fmtTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ===== 公共页面骨架 =====
function page(title, body) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} · 佳佳雨的穿搭</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", sans-serif; background: #faf7f2; color: #3d3229; }
  .wrap { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }
  header { text-align: center; padding: 16px 0 24px; }
  header h1 { font-size: 26px; letter-spacing: 2px; }
  header p { color: #a08c78; margin-top: 6px; font-size: 14px; }
  .btn { display: inline-block; background: #c96f4a; color: #fff; border: none; border-radius: 8px;
         padding: 10px 22px; font-size: 15px; text-decoration: none; cursor: pointer; }
  .btn.ghost { background: transparent; color: #c96f4a; border: 1px solid #c96f4a; }
  .card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px;
          box-shadow: 0 1px 4px rgba(90,70,50,.08); }
  .card a { text-decoration: none; color: inherit; display: block; }
  .who { font-weight: bold; font-size: 16px; }
  .match { margin-top: 6px; font-size: 15px; }
  .match b { color: #c96f4a; }
  .time { color: #b3a493; font-size: 12px; margin-top: 8px; }
  .empty { text-align: center; color: #a08c78; padding: 48px 0; }
  form label { display: block; font-size: 14px; margin: 14px 0 6px; }
  form label small { color: #a08c78; }
  form input, form textarea { width: 100%; border: 1px solid #d8cabb; border-radius: 8px;
       padding: 10px 12px; font-size: 15px; font-family: inherit; background: #fff; }
  .error { background: #fdecea; color: #b3261e; border-radius: 8px; padding: 10px 14px;
           margin-bottom: 12px; font-size: 14px; }
  .detail-note { background: #fff; border-left: 4px solid #c96f4a; border-radius: 8px;
                 padding: 12px 14px; margin-top: 12px; font-size: 15px; }
  .back { margin-top: 20px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>佳佳雨的穿搭</h1>
    <p>每天早上，直接看别人的搭配答案</p>
  </header>
  ${body}
</div>
</body>
</html>`;
}

// ===== F1 首页：穿搭列表（按时间倒序）=====
app.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM outfits ORDER BY id DESC").all();
  let body;
  if (rows.length === 0) {
    body = `<div class="empty">还没有穿搭，来发第一条吧</div>`;
  } else {
    body = rows.map((r) => `
    <div class="card">
      <a href="/outfit/${r.id}">
        <div class="who">${esc(r.nickname)}</div>
        <div class="match">上衣 <b>${esc(r.top_item)}</b> ＋ 裤子 <b>${esc(r.bottom_item)}</b></div>
        <div class="time">${fmtTime(r.created_at)}</div>
      </a>
    </div>`).join("\n");
  }
  body = `<div style="text-align:center;margin-bottom:18px;">
            <a class="btn" href="/new">＋ 发布穿搭</a>
          </div>\n` + body;
  res.send(page("首页", body));
});

// ===== F3 发布穿搭：表单页 =====
// values/error 用于校验失败时回显已填内容（AC3：内容不丢）
function formBody(values = {}, error = "") {
  const v = (k) => esc(values[k] ?? "");
  return `
  ${error ? `<div class="error">${esc(error)}</div>` : ""}
  <form method="POST" action="/new">
    <label>昵称 <small>（必填）</small></label>
    <input name="nickname" value="${v("nickname")}" placeholder="比如：佳佳雨">
    <label>上衣 <small>（必填）</small></label>
    <input name="top_item" value="${v("top_item")}" placeholder="比如：白色宽松衬衫">
    <label>裤子 <small>（必填）</small></label>
    <input name="bottom_item" value="${v("bottom_item")}" placeholder="比如：浅蓝直筒牛仔裤">
    <label>搭配心得 <small>（选填，一句话）</small></label>
    <textarea name="note" rows="2" placeholder="比如：卷个袖口更精神，配小白鞋也好看"></textarea>
    <p style="margin-top:18px;">
      <button class="btn" type="submit">发布</button>
      <a class="btn ghost" href="/">取消</a>
    </p>
  </form>`;
}
app.get("/new", (req, res) => {
  res.send(page("发布穿搭", formBody()));
});

// ===== F3 发布穿搭：提交处理 =====
app.post("/new", (req, res) => {
  const { nickname, top_item, bottom_item, note } = req.body || {};
  // AC3：必填项校验——不合格退回提示，已填内容不丢
  if (!String(nickname || "").trim() || !String(top_item || "").trim() || !String(bottom_item || "").trim()) {
    res.status(400).send(page("发布穿搭", formBody(req.body, "昵称、上衣、裤子都是必填项，请补全后再发布～")));
    return;
  }
  db.prepare("INSERT INTO outfits (nickname, top_item, bottom_item, note, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(String(nickname).trim(), String(top_item).trim(), String(bottom_item).trim(), String(note || "").trim(), new Date().toISOString());
  res.redirect("/"); // AC2：发布成功回首页，新内容在最上面（id 倒序）
});

// ===== F2 详情页 =====
app.get("/outfit/:id", (req, res) => {
  const r = db.prepare("SELECT * FROM outfits WHERE id = ?").get(req.params.id);
  if (!r) {
    res.status(404).send(page("找不到啦", `<div class="empty">这条穿搭不存在或已被删除</div>
      <p class="back" style="text-align:center;"><a class="btn ghost" href="/">返回首页</a></p>`));
    return;
  }
  const body = `
    <div class="card">
      <div class="who">${esc(r.nickname)}</div>
      <div class="match">上衣 <b>${esc(r.top_item)}</b></div>
      <div class="match">裤子 <b>${esc(r.bottom_item)}</b></div>
      ${r.note ? `<div class="detail-note">💬 ${esc(r.note)}</div>` : ""}
      <div class="time">发布于 ${fmtTime(r.created_at)}</div>
    </div>
    <p class="back"><a class="btn ghost" href="/">← 返回首页</a></p>`;
  res.send(page("穿搭详情", body));
});

// ===== 启动 =====
app.listen(PORT, () => {
  console.log(`佳佳雨的穿搭已启动：http://localhost:${PORT}`);
});
