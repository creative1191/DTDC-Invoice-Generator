@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================

echo 1. Checking / Syncing Web Frontend assets...
if not exist web_app\index.html (
  if exist dist\index.html (
    echo Syncing from dist\ to web_app\...
    xcopy /E /I /Y dist web_app
  ) else (
    echo Building web assets...
    call npm install --legacy-peer-deps
    call npm run build
    xcopy /E /I /Y dist web_app
  )
) else (
  echo Pre-built offline web assets verified in web_app\
)

echo.
echo 2. Installing PyInstaller...
python -m pip install --upgrade pyinstaller

echo.
echo 3. Compiling Standalone 100%% Offline Windows Executable...
python build_exe.py

echo.
echo ========================================================
echo  BUILD COMPLETE!
echo  Your 100%% Offline App is ready at: dist_exe\DTDC_Bill_Generator.exe
echo ========================================================
pause
