@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================
echo.

:: 1. Detect Python or Py launcher
set "PYTHON_CMD="
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        set "PYTHON_CMD=py"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python was not found in your system PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo Make sure to check "Add python.exe to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Using Python: %PYTHON_CMD%

:: 2. Check Node / npm for rebuilding web assets
where npm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    if not exist node_modules (
        echo Installing Node dependencies...
        call npm install --legacy-peer-deps
    )
    echo Building latest web frontend assets (npm run build)...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] npm run build returned an error.
        echo Checking if pre-existing assets exist in web_app...
    )
) else (
    echo [NOTE] npm not found in PATH. Using bundled web_app assets.
)

:: 3. Sync dist to web_app if dist exists
if exist dist\index.html (
    echo Syncing dist to web_app...
    if not exist web_app mkdir web_app
    xcopy /E /I /Y dist\* web_app\ >nul
    echo [OK] Web assets synced to web_app\
) else (
    if not exist web_app\index.html (
        echo [ERROR] web_app\index.html not found!
        echo Please ensure npm is installed so web assets can be compiled.
        pause
        exit /b 1
    )
)

:: 4. Ensure PyInstaller is installed
echo.
echo Installing / Upgrading PyInstaller...
%PYTHON_CMD% -m pip install --upgrade pyinstaller

:: 5. Compile Standalone 100% Offline Windows Executable
echo.
echo Compiling Standalone Windows Executable via build_exe.py...
%PYTHON_CMD% build_exe.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed! Please review the error messages above.
    pause
    exit /b %ERRORLEVEL%
)

:: 6. Completion
echo.
if exist dist_exe\DTDC_Bill_Generator.exe (
    echo ========================================================
    echo  BUILD COMPLETE!
    echo  Your 100%% Offline App is ready at:
    echo  dist_exe\DTDC_Bill_Generator.exe
    echo ========================================================
    echo.
    echo Opening output folder in Windows Explorer...
    start "" "dist_exe"
) else (
    echo ========================================================
    echo  [WARNING] Output file dist_exe\DTDC_Bill_Generator.exe
    echo  was not detected.
    echo ========================================================
)

echo.
pause
