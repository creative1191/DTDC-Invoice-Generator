@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================

echo 1. Checking / Building Frontend assets...
if not exist dist\index.html (
  echo Building production web assets...
  call npm install
  call npm run build
) else (
  echo Production assets found in dist\
)

echo.
echo 2. Installing Python requirements (pywebview, pyinstaller)...
pip install pywebview pyinstaller

echo.
echo 3. Compiling Standalone 100%% Offline Windows Executable...
pyinstaller --onefile --windowed --name DTDC_Bill_Generator ^
  --add-data "dist;dist" ^
  --hidden-import=webview ^
  --hidden-import=clr ^
  --collect-all webview ^
  app_gui.py --clean -y

echo.
echo ========================================================
echo  BUILD COMPLETE!
echo  Your 100%% Offline App is ready at: dist\DTDC_Bill_Generator.exe
echo ========================================================
pause
