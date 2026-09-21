@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================

echo 1. Building and Syncing Latest Web Frontend assets...
if exist package.json (
  echo Running npm run build to compile latest React code...
  call npm run build
  echo Syncing dist\ to web_app\...
  if exist web_app rmdir /s /q web_app
  xcopy /E /I /Y dist web_app
) else if exist dist\index.html (
  echo Syncing from dist\ to web_app\...
  if exist web_app rmdir /s /q web_app
  xcopy /E /I /Y dist web_app
) else (
  echo Using verified assets in web_app\
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
