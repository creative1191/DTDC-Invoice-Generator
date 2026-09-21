import os
import sys
import shutil
import subprocess

def main():
    print("=== DTDC Bill Generator - Windows EXE Builder ===")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    
    web_app_dir = os.path.join(base_dir, "web_app")
    dist_dir = os.path.join(base_dir, "dist")
    
    # 1. Always ensure web_app has the latest built assets from dist
    if os.path.isdir(dist_dir) and os.path.isfile(os.path.join(dist_dir, "index.html")):
        print("Syncing latest web assets from dist/ to web_app/...")
        try:
            if os.path.exists(web_app_dir):
                shutil.rmtree(web_app_dir, ignore_errors=True)
        except Exception:
            pass
        os.makedirs(web_app_dir, exist_ok=True)
        shutil.copytree(dist_dir, web_app_dir, dirs_exist_ok=True)
    elif not os.path.isfile(os.path.join(web_app_dir, "index.html")):
        print("Building web assets via npm run build...")
        subprocess.run(["npm", "run", "build"], shell=True, check=True)
        if os.path.isdir(dist_dir) and os.path.isfile(os.path.join(dist_dir, "index.html")):
            os.makedirs(web_app_dir, exist_ok=True)
            shutil.copytree(dist_dir, web_app_dir, dirs_exist_ok=True)
        else:
            print("ERROR: Could not find or build index.html in dist or web_app folder!")
            sys.exit(1)
            
    print(f"Verified web assets in: {web_app_dir}")

    # 2. Ensure PyInstaller is available, auto-install if missing
    try:
        import PyInstaller.__main__
    except ImportError:
        print("PyInstaller not found. Installing pyinstaller via pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pyinstaller"])
        import PyInstaller.__main__

    # 3. Setup paths and parameters
    sep = ";" if sys.platform == "win32" or os.name == "nt" else ":"
    dist_exe_dir = os.path.join(base_dir, "dist_exe")
    build_work_dir = os.path.join(base_dir, "build_work")
    os.makedirs(dist_exe_dir, exist_ok=True)
    os.makedirs(build_work_dir, exist_ok=True)
    
    args = [
        "app_gui.py",
        "--name=DTDC_Bill_Generator",
        "--onefile",
        "--windowed",
        f"--distpath={dist_exe_dir}",
        f"--workpath={build_work_dir}",
        f"--add-data=web_app{sep}web_app",
        "--hidden-import=http.server",
        "--hidden-import=socket",
        "--hidden-import=threading",
        "--hidden-import=subprocess",
        "--hidden-import=webbrowser",
        "--hidden-import=mimetypes",
        "--hidden-import=functools",
        "--hidden-import=ctypes",
        "--clean",
        "-y"
    ]
    
    print("\nExecuting PyInstaller with args:")
    for a in args:
        print("  ", a)
    print()
    
    try:
        PyInstaller.__main__.run(args)
    except SystemExit as e:
        if e.code not in (0, None):
            print(f"PyInstaller failed with exit code: {e.code}")
            sys.exit(e.code)
    except Exception as e:
        print(f"PyInstaller encountered an error: {e}")
        sys.exit(1)
    
    exe_name = "DTDC_Bill_Generator.exe" if sys.platform == "win32" or os.name == "nt" else "DTDC_Bill_Generator"
    final_path = os.path.join(dist_exe_dir, exe_name)
    if os.path.exists(final_path):
        size_mb = os.path.getsize(final_path) / (1024 * 1024)
        
        # Clean up temporary PyInstaller build artifacts to keep repo small
        try:
            if os.path.exists(build_work_dir):
                shutil.rmtree(build_work_dir, ignore_errors=True)
            spec_file = os.path.join(base_dir, "DTDC_Bill_Generator.spec")
            if os.path.exists(spec_file):
                os.remove(spec_file)
        except Exception:
            pass

        print("\n========================================================")
        print(f" SUCCESS: {exe_name} created successfully!")
        print(f" Path: {final_path}")
        print(f" Size: {size_mb:.2f} MB")
        print("========================================================")

        # Create Windows Desktop shortcut if running on a local desktop machine (not in CI)
        if sys.platform == "win32" and not os.environ.get("CI") and not os.environ.get("GITHUB_ACTIONS"):
            try:
                desktop = os.path.join(os.path.expanduser("~"), "Desktop")
                if os.path.isdir(desktop):
                    shortcut_path = os.path.join(desktop, "DTDC Bill Generator.lnk")
                    ps_cmd = (
                        f'$WshShell = New-Object -comObject WScript.Shell; '
                        f'$Shortcut = $WshShell.CreateShortcut("{shortcut_path}"); '
                        f'$Shortcut.TargetPath = "{final_path}"; '
                        f'$Shortcut.WorkingDirectory = "{dist_exe_dir}"; '
                        f'$Shortcut.Save()'
                    )
                    subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    if os.path.exists(shortcut_path):
                        print(f" Desktop Shortcut created: {shortcut_path}")
            except Exception:
                pass
    else:
        print(f"\nERROR: {exe_name} was not found in {dist_exe_dir}")
        if os.path.exists(dist_exe_dir):
            for item in os.listdir(dist_exe_dir):
                print(f" - {item}")
        sys.exit(1)

if __name__ == "__main__":
    main()
