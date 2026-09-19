import os
import sys
import shutil

def main():
    print("=== DTDC Bill Generator - Windows EXE Builder ===")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    web_app_dir = os.path.join(base_dir, "web_app")
    dist_dir = os.path.join(base_dir, "dist")
    
    # Ensure web_app has the required files
    if not os.path.isfile(os.path.join(web_app_dir, "index.html")):
        if os.path.isdir(dist_dir) and os.path.isfile(os.path.join(dist_dir, "index.html")):
            print("Syncing web assets from dist to web_app...")
            if os.path.exists(web_app_dir):
                shutil.rmtree(web_app_dir)
            shutil.copytree(dist_dir, web_app_dir)
        else:
            print("ERROR: index.html not found in web_app or dist folder!")
            sys.exit(1)
            
    print(f"Verified web assets in: {web_app_dir}")

    # Invoke PyInstaller programmatically
    import PyInstaller.__main__
    
    sep = ";" if sys.platform == "win32" else ":"
    dist_exe_dir = os.path.join(base_dir, "dist_exe")
    build_work_dir = os.path.join(base_dir, "build_work")
    
    # Use relative paths for --add-data to prevent any Windows drive letter colon issues
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
        "--clean",
        "-y"
    ]
    
    print("Executing PyInstaller with args:")
    for a in args:
        print("  ", a)
    print()
    
    PyInstaller.__main__.run(args)
    
    exe_name = "DTDC_Bill_Generator.exe" if sys.platform == "win32" else "DTDC_Bill_Generator"
    final_path = os.path.join(dist_exe_dir, exe_name)
    if os.path.exists(final_path):
        size_mb = os.path.getsize(final_path) / (1024 * 1024)
        print("\n========================================================")
        print(f" SUCCESS: {exe_name} created successfully!")
        print(f" Path: {final_path}")
        print(f" Size: {size_mb:.2f} MB")
        print("========================================================")
    else:
        print(f"\nCompleted PyInstaller run. Files in {dist_exe_dir}:")
        if os.path.exists(dist_exe_dir):
            for item in os.listdir(dist_exe_dir):
                print(f" - {item}")

if __name__ == "__main__":
    main()
