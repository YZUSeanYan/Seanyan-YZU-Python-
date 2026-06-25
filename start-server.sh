#!/bin/bash
# SeanYan 后端一键启动脚本 (Linux/Mac)

echo "=========================================="
echo "  SeanYan Python刷题系统 - 服务端启动"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    echo "  下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "[错误] Node.js 版本过低 (当前: $(node -v))，需要 18+"
    exit 1
fi

echo "[1/3] Node.js 版本: $(node -v)"

# Check dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
    echo "[2/3] 安装依赖中... (首次运行需要)"
    npm install --production
else
    echo "[2/3] 依赖已安装"
fi

# Start server
echo "[3/3] 启动服务端..."
echo ""
node server/index.js
