@echo off
cd /d "%~dp0\.."
set NODE_ENV=development
node node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 3000
