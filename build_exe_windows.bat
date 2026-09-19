@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo ========================================================
echo Installing required packages...
pip install -r requirements.txt

echo.
echo Building Standalone Windows Executable (.exe)...
pyinstaller --onefile --windowed --name DTDC_Bill_Generator ^
  --add-data "public;assets" ^
  --collect-all barcode ^
  --hidden-import=barcode ^
  --hidden-import=barcode.writer ^
  --hidden-import=reportlab ^
  --hidden-import=PIL ^
  --hidden-import=customtkinter ^
  app_gui.py --clean -y

echo.
echo ========================================================
echo  BUILD COMPLETE! Check: dist\DTDC_Bill_Generator.exe
echo ========================================================
pause
