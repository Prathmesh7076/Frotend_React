@echo off
setlocal
cd /d "%~dp0"
echo ========================================
echo  Product Admin Dashboard - Run (Windows)
echo ========================================

if not exist "node_modules\node_modules" (
  echo [1/2] Installing dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Failed to install. Trying to repair Next.js scoped packages...
    call node scripts\ensure-next-deps.cjs
  )
)

if not exist "node_modules\@next\env\dist\index.js" (
  echo [1.5/2] Re-checking Next.js scoped packages...
  call node scripts\ensure-next-deps.cjs
)

echo [2/2] Starting Next.js dev server on http://localhost:3000
call npm run dev
endlocal
