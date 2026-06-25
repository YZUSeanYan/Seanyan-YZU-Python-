# SeanYan YZU Python 刷题系统

这是一个面向 Python 课程复习的小型刷题网站，包含练习、错题本、背题模式、仿真考试、学习统计和管理员后台。项目已经从原来的 zip 包整理为完整源码仓库，后续可以直接用 Git 管理、部署和继续开发。

## 项目功能

- 用户注册、登录和学习数据保存
- Python 题库练习，支持题型筛选和解析展示
- 错题本、重做错题、错题统计
- 背题模式和掌握状态记录
- 仿真考试、答题卡、成绩报告
- 学习统计、正确率、连续学习天数、近 7 天活动
- 管理员后台查看用户数据、备注姓名、删除账号
- 管理员导入 Word 题库文件，自动解析并去重
- 后端使用 SQLite 保存数据，适合小班级或课程项目使用

## 技术栈

- 前端：React 19 + TypeScript + Vite
- 样式：Tailwind CSS + Radix UI
- 后端：Node.js + Express
- 数据库：SQLite，使用 `better-sqlite3`
- Word 解析：`mammoth`
- 移动端壳：Capacitor Android

## 目录说明

```text
src/                  前端源码
src/pages/            页面，例如练习、考试、后台
src/components/       页面组件和 UI 组件
src/contexts/         登录状态和用户学习数据
src/lib/              API、音效、工具函数
server/               后端服务
server/index.js       Express API 和 SQLite 数据逻辑
public/questions.json 默认题库
public/sounds/        答题音效
android/              Capacitor Android 工程
```

## 本地运行

先安装 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

前端开发地址通常是：

```text
http://localhost:5173
```

## 启动后端

后端默认端口是 `3456`，数据会保存在 `server/data/seanyan.db`。

```bash
node server/index.js
```

也可以指定端口和管理员密码：

```bash
PORT=3456 ADMIN_PASSWORD=你的管理员密码 node server/index.js
```

Windows PowerShell 示例：

```powershell
$env:PORT="3456"
$env:ADMIN_PASSWORD="你的管理员密码"
node server/index.js
```

## 管理员账号

默认管理员学号：

```text
admin
```

管理员密码建议通过服务器环境变量 `ADMIN_PASSWORD` 配置。开发环境没有配置时，默认值是：

```text
admin123
```

正式部署时请务必设置自己的 `ADMIN_PASSWORD`，不要使用默认密码。

## 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist/`。这个目录不会提交到 Git。

## 部署说明

常见部署方式：

1. 服务器安装 Node.js 18+
2. 克隆本仓库
3. 执行 `npm install`
4. 执行 `npm run build`
5. 启动后端 `node server/index.js`
6. 使用 Nginx 托管 `dist/`，并把 API 反向代理到后端端口

更详细的部署说明见 `DEPLOY.md`。

## Word 题库导入

管理员后台支持上传 Word 题库文件。建议每道题包含这些信息：

- 题目类型：单选题、填空题、程序填空、程序改错、AI通识等
- 题干
- 选项，单选题需要 A/B/C/D
- 正确答案
- 解析
- 知识点或分类
- 难度

导入时系统会尽量解析题目内容，并根据题干、答案等信息去重。为了提高识别成功率，Word 文档请保持格式清晰，不要把多道题写成一整段。

## 数据文件

运行后会生成这些本地数据：

```text
server/data/seanyan.db
server/data/uploads/
```

这些文件包含用户数据和上传文件，不会提交到 Git。部署前后请注意备份数据库：

```bash
cp server/data/seanyan.db server/data/seanyan-backup.db
```

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 启动前端开发服务器
npm run build    # 构建前端生产版本
npm run lint     # 代码检查
node server/index.js  # 启动后端
```

## 开发注意事项

- 不要提交 `node_modules/`、`dist/`、数据库、日志和上传文件
- 不要把真实服务器密码、管理员密码、Token 写进源码
- 修改后建议至少执行一次 `npm run build`
- 后端数据库结构目前在 `server/index.js` 中自动创建和迁移
- 前端 API 地址目前在 `src/lib/api.ts` 中配置

## 当前状态

这个仓库已经整理为可继续维护的源码仓库。后续新增功能、修复 bug、部署更新都可以通过正常 Git 提交来追踪。
