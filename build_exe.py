import os
import sys
import shutil

def main():
    print("=== DTDC Bill Generator - Windows EXE Builder ===")
    
    # 1. Check or prepare web_app directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, "dist")
    web_app_dir = os.path.join(base_dir, "web_app")
    
    if os.path.isdir(dist_dir) and os.path.isfile(os.path.join(dist_dir, "index.html")):
        print(f"Copying compiled web assets from {dist_dir} to {web_app_dir}...")
        if os.path.exists(web_app_dir):
            shutil.rmtree(web_app_dir)
        shutil.copytree(dist_dir, web_app_dir)
    elif os.path.isdir(web_app_dir) and os.path.isfile(os.path.join(web_app_dir, "index.html")):
        print(f"Using existing web assets in {web_app_dir}...")
    else:
        print("ERROR: No compiled web assets found (index.html missing). Run 'npm run build' first.")
        sys.exit(1)

    # 2. Configure PyInstaller
    import PyInstaller.__main__
    
    sep = ";" if sys.platform == "win32" else ":"
    dist_exe_dir = os.path.join(base_dir, "dist_exe")
    build_work_dir = os.path.join(base_dir, "build_work")
    
    args = [
        os.path.join(base_dir, "app_gui.py"),
        "--name=DTDC_Bill_Generator",
        "--onefile",
        "--windowed",
        f"--distpath={dist_exe_dir}",
        f"--workpath={build_work_dir}",
        f"--add-data={web_app_dir}{sep}web_app",
        "--hidden-import=http.server",
        "--hidden-import=socket",
        "--hidden-import=threading",
        "--hidden-import=subprocess",
        "--hidden-import=webbrowser",
        "--hidden-import=tkinter",
        "--clean",
        "-y"
    ]
    
    print("\nStarting PyInstaller build with arguments:")
    for a in args:
        print(" ", a)
    print()
    
    PyInstaller.__main__.run(args)
    
    target_exe = os.path.join(dist_exe_dir, "DTDC_Bill_Generator.exe" if sys.platform == "win32" else "DTDC_Bill_Generator")
    if os.path.exists(target_exe):
        size_mb = os.path.getsize(target_exe) / (1024 * 1024)
        print("\n========================================================")
        print(f" SUCCESS! Executable built successfully: {target_exe}")
        print(f" Size: {size_mb:.2f} MB")
        print("========================================================")
    else:
        print(f"\nBuild finished. Check output in: {dist_exe_dir}")

if __name__ == "__main__":
    main()
