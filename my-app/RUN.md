# RUN.md —— 佳佳雨的穿搭 · 运行说明（Day 7）

## 怎么启动

打开 PowerShell 或 CMD，依次执行：

```bash
cd C:\Users\shine\OneDrive\Desktop\my-first-project\my-app
node server.js
```

看到「佳佳雨的穿搭已启动：http://localhost:3000」就说明起来了。

然后浏览器打开 **http://localhost:3000** 即可使用。

## 停止

在运行服务器的窗口按 `Ctrl + C`。

## 页面地址

| 页面 | 地址 |
|---|---|
| 首页（穿搭列表） | http://localhost:3000/ |
| 发布穿搭（表单） | http://localhost:3000/new |
| 穿搭详情 | http://localhost:3000/outfit/数字编号 |

## 数据存在哪

`my-app/data.db`（SQLite 单文件）。`.gitignore` 已忽略 `*.db`，数据库不会上传 GitHub。
想清空数据：停掉服务器，删掉 `data.db`，重新启动会自动建空表。

## 常见问题

- **端口被占用**（报 `EADDRINUSE`）：说明 3000 端口被别的程序占了，或者上一个服务器没关。关掉旧的再启动。
- **首次运行提示 SQLite experimental 警告**：正常，Node 22 的内置 SQLite 还是实验特性，不影响使用。
- **依赖**：只需要 Express（已装在 `node_modules`，`npm install express` 可随时重装）。
