@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================

echo 1. Checking / Building Web Frontend assets...
if not exist dist\index.html (
  echo Installing dependencies and building production web assets...
  call npm install --legacy-peer-deps
  call npm run build
) else (
  echo Production assets found in dist\
)

echo.
echo 2. Installing PyInstaller...
python -m pip install pyinstaller

echo.
echo 3. Compiling Standalone 100%% Offline Windows Executable...
python build_exe.py

echo.
echo ========================================================
echo  BUILD COMPLETE!
echo  Your 100%% Offline App is ready at: dist_exe\DTDC_Bill_Generator.exe
echo ========================================================
pause
