@echo off
chcp 65001 >nul
echo ==========================================
echo   SeanYan Python刷题系统 - 服务端启动
echo ==========================================
echo.

:: Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo   下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Node.js 版本: 
node -v

:: Check dependencies
if not exist "node_modules\express" (
    echo [2/3] 安装依赖中... (首次运行需要)
    call npm install --production
) else (
    echo [2/3] 依赖已安装
)

:: Start server
echo [3/3] 启动服务端...
echo.
node server\index.js
pause
