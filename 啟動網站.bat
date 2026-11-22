@echo off
chcp 65001 >nul
set "NODE_EXE=C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%NODE_EXE%" (
  echo 正在啟動本地伺服器 http://localhost:5173 ...
  start "" "http://localhost:5173"
  "%NODE_EXE%" "%~dp0server.cjs"
) else (
  echo 正在直接開啟 TravelGuideStudio.html ...
  start "" "%~dp0TravelGuideStudio.html"
)
