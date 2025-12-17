@echo off
setlocal
title MU Online Editor Server

:check_node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b
)

:check_modules
if not exist "node_modules" (
    echo [INFO] First run detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
)

:start
cls
echo ===================================================
echo      MU ONLINE EDITOR SERVER LAUNCHER
echo ===================================================
echo.
echo Starting server...
echo.

node server.js

if %errorlevel% equ 10 (
    echo.
    echo [INFO] Restart requested...
    timeout /t 2 >nul
    goto start
)

if %errorlevel% equ 0 (
    echo.
    echo [INFO] Server stopped.
    echo Press any key to start the server again...
    pause >nul
    goto start
)

echo.
echo [WARN] Server stopped unexpectedly (Code: %errorlevel%).
pause
goto start
