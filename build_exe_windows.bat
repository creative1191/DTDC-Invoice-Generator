@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================

echo.
echo 1. Building and Syncing Latest Web Frontend assets...
if exist package.json (
  echo Compiling latest React code (npm run build)...
  call npm run build
)

if exist dist\index.html (
  echo Syncing dist to web_app...
  if not exist web_app mkdir web_app
  xcopy /E /I /Y dist\* web_app\ >nul
  echo Web assets successfully synced to web_app\
) else (
  echo Using existing assets in web_app\
)

echo.
echo 2. Ensuring PyInstaller is installed...
python -m pip install --upgrade pyinstaller

echo.
echo 3. Compiling Standalone 100%% Offline Windows Executable...
python build_exe.py

echo.
if exist dist_exe\DTDC_Bill_Generator.exe (
  echo ========================================================
  echo  BUILD COMPLETE!
  echo  Your 100%% Offline App is ready at:
  echo  dist_exe\DTDC_Bill_Generator.exe
  echo ========================================================
) else (
  echo ========================================================
  echo  BUILD WARNING: Check console output above for details.
  echo ========================================================
)
pause
