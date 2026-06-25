# SeanYan 后端部署说明

## 为什么需要部署后端？

**当前问题**：每位同学的数据都存在自己浏览器的 localStorage 中，互相隔离。
- 同学A在电脑A注册 → 数据存在电脑A的浏览器
- 管理员在电脑B查看 → 看不到同学A的数据

**解决方案**：部署一个共享的后端服务器，所有设备连接到同一个后端，数据统一存储在 SQLite 数据库中。

---

## 方案一：本机快速启动（局域网内可用）

适合同一WiFi/局域网下的同学使用。

### 步骤

1. **安装 Node.js 18+**
   - 下载地址：https://nodejs.org/ （选 LTS 版本）

2. **启动服务端**
   - Windows：双击 `start-server.bat`
   - Mac/Linux：终端运行 `bash start-server.sh`

3. **获取本机IP地址**
   - Windows：cmd 中运行 `ipconfig`，找 IPv4 地址
   - Mac/Linux：终端运行 `ifconfig` 或 `ip addr`，找 `192.168.x.x`

4. **其他同学访问**
   - 浏览器打开 `http://你的IP:3456`
   - 例如：`http://192.168.1.5:3456`

### 注意事项
- 服务端电脑需要保持开机
- 防火墙可能需要放行 3456 端口
- 所有数据保存在 `server/data/seanyan.db` 文件中

---

## 方案二：云服务器部署（公网访问）

适合全班同学随时随地访问。

### 推荐平台
- 阿里云轻量应用服务器（学生优惠约 10元/月）
- 腾讯云轻量服务器（学生优惠约 10元/月）
- 其他 VPS 服务商

### 部署步骤

1. **购买云服务器**（推荐 Ubuntu 22.04）

2. **上传项目文件**（通过 SFTP 或 scp）

3. **SSH 登录服务器**，执行：
```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 进入项目目录
cd seanyan

# 安装依赖
npm install --production

# 启动服务
node server/index.js
```

4. **放行防火墙端口**
```bash
sudo ufw allow 3456/tcp
```

5. **使用 systemd 保持后台运行**
创建 `/etc/systemd/system/seanyan.service`：
```ini
[Unit]
Description=SeanYan Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/seanyan
ExecStart=/usr/bin/node server/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

然后执行：
```bash
sudo systemctl enable seanyan
sudo systemctl start seanyan
sudo systemctl status seanyan
```

6. **所有人通过公网IP访问**
   - 浏览器打开 `http://服务器公网IP:3456`

---

## 方案三：使用反向代理 + 域名（推荐长期运行）

如果有域名，可以用 Nginx 反向代理，配置 HTTPS。

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name seanyan.yourdomain.com;

    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 数据备份

SQLite 数据库文件位置：`server/data/seanyan.db`

**定期备份**：
```bash
# 复制数据库文件
cp server/data/seanyan.db server/data/seanyan-backup-$(date +%Y%m%d).db
```

---

## 管理员信息

| 项目 | 值 |
|------|-----|
| 学号 | `admin` |
| 密码 | 通过服务器环境变量 `ADMIN_PASSWORD` 配置；开发默认值为 `admin123` |
| 后台地址 | 首页点击头像 → "后台管理" |

---

## 常见问题

### Q: 提示 "无法连接到服务器"？
A: 检查：
1. 服务端是否已启动（`node server/index.js`）
2. 防火墙是否放行 3456 端口
3. 访问地址是否正确（IP:端口）

### Q: 如何修改端口？
A: 设置环境变量：`PORT=8080 node server/index.js`

### Q: 数据会丢失吗？
A: 不会。所有数据存储在 `server/data/seanyan.db` 文件中，只要备份这个文件就不会丢失。

### Q: 可以同时支持多少人使用？
A: SQLite + Node.js 可以轻松支持几十到上百人同时使用。

