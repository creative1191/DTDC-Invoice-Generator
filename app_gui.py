import os
import sys
import time
import socket
import threading
import functools
import mimetypes
import subprocess
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Robust stdout/stderr/stdin safe stream for PyInstaller --windowed mode on Windows
# In windowed mode, sys.stdout and sys.stderr are None, and standard handles are invalid.
class SafeStream:
    def write(self, s):
        pass
    def flush(self):
        pass
    def isatty(self):
        return False

if getattr(sys, 'stdout', None) is None or not hasattr(sys.stdout, 'write'):
    sys.stdout = SafeStream()
if getattr(sys, 'stderr', None) is None or not hasattr(sys.stderr, 'write'):
    sys.stderr = SafeStream()
if getattr(sys, 'stdin', None) is None or not hasattr(sys.stdin, 'read'):
    class SafeIn:
        def read(self, *args, **kwargs):
            return ''
        def readline(self, *args, **kwargs):
            return ''
    sys.stdin = SafeIn()

# Ensure correct MIME types on Windows
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('font/woff', '.woff')
mimetypes.add_type('font/ttf', '.ttf')

# Global timestamp of the last heartbeat received from the web app
last_heartbeat_time = time.time() + 60.0  # 60 seconds initial grace period

def locate_web_dir():
    """Locate the bundled or local web_app folder containing index.html."""
    candidates = []
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
        candidates.append(os.path.join(base_dir, 'web_app'))
        candidates.append(os.path.join(base_dir, 'dist'))
        candidates.append(base_dir)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates.append(os.path.join(base_dir, 'web_app'))
        candidates.append(os.path.join(base_dir, 'dist'))
        candidates.append(base_dir)

    for c in candidates:
        if os.path.isfile(os.path.join(c, 'index.html')):
            return c
    return None

def find_free_port():
    """Find a random available port on localhost with socket reuse."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    except Exception:
        pass
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

class OfflineSpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        self.target_dir = directory
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format, *args):
        # Silence console log spam in desktop mode
        pass

    def log_error(self, format, *args):
        # Prevent socket error tracebacks from crashing GUI
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        global last_heartbeat_time
        clean_path = self.path.split('?')[0].split('#')[0]

        # Heartbeat endpoint to keep the local server alive as long as app is open
        if clean_path == '/api/heartbeat':
            last_heartbeat_time = time.time()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                self.wfile.write(b'{"status":"ok"}')
            except Exception:
                pass
            return

        target_path = os.path.join(self.target_dir, clean_path.lstrip('/'))
        
        # If file doesn't exist, fallback to index.html (SPA routing behavior)
        if not os.path.exists(target_path) or os.path.isdir(target_path):
            index_path = os.path.join(self.target_dir, 'index.html')
            if os.path.isfile(index_path):
                self.path = '/index.html'
                
        try:
            return super().do_GET()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            pass

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

class ThreadedHTTPServer:
    def __init__(self, host, directory, port=0):
        self.host = host
        self.directory = directory
        handler = functools.partial(OfflineSpaHandler, directory=directory)
        self.server = ReusableHTTPServer((host, port), handler)
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    def start(self):
        self.thread.start()

    def stop(self):
        try:
            self.server.shutdown()
            self.server.server_close()
        except Exception:
            pass

def get_browser_executables():
    """Detect Edge, Chrome, or Brave executable paths via Windows Registry and standard directories."""
    candidates = []
    
    # 1. Check Windows Registry (App Paths)
    if sys.platform == 'win32':
        try:
            import winreg
            for app_name in ('msedge.exe', 'chrome.exe', 'brave.exe'):
                for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
                    try:
                        key_path = rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{app_name}"
                        with winreg.OpenKey(root, key_path) as key:
                            val, _ = winreg.QueryValueEx(key, "")
                            if val and os.path.isfile(val) and val not in candidates:
                                candidates.append(val)
                    except Exception:
                        pass
        except Exception:
            pass

    # 2. Check Standard Directory Locations
    sys_drive = os.environ.get('SystemDrive', 'C:')
    prog_files = os.environ.get('ProgramFiles', rf'{sys_drive}\Program Files')
    prog_files_x86 = os.environ.get('ProgramFiles(x86)', rf'{sys_drive}\Program Files (x86)')
    local_app_data = os.environ.get('LOCALAPPDATA', rf'{sys_drive}\Users\Default\AppData\Local')

    direct_paths = [
        rf"{prog_files_x86}\Microsoft\Edge\Application\msedge.exe",
        rf"{prog_files}\Microsoft\Edge\Application\msedge.exe",
        rf"{local_app_data}\Microsoft\Edge\Application\msedge.exe",
        rf"{prog_files}\Google\Chrome\Application\chrome.exe",
        rf"{prog_files_x86}\Google\Chrome\Application\chrome.exe",
        rf"{local_app_data}\Google\Chrome\Application\chrome.exe",
        rf"{prog_files}\BraveSoftware\Brave-Browser\Application\brave.exe",
        rf"{prog_files_x86}\BraveSoftware\Brave-Browser\Application\brave.exe",
    ]
    for p in direct_paths:
        if os.path.isfile(p) and p not in candidates:
            candidates.append(p)

    # 3. Check System PATH
    import shutil
    for cmd in ('msedge', 'chrome', 'brave'):
        found = shutil.which(cmd)
        if found and os.path.isfile(found) and found not in candidates:
            candidates.append(found)

    return candidates

def launch_app_window(url):
    """
    Launch in a 100% Dedicated Desktop Application Window.
    Uses --app=URL and --new-window without --user-data-dir, guaranteeing
    a clean window without browser tabs, URL bar, or bookmark bars.
    Safely avoids [WinError 6] Invalid Handle in windowed/noconsole mode.
    """
    candidates = get_browser_executables()
    
    extra_flags = {}
    if sys.platform == 'win32':
        extra_flags['creationflags'] = getattr(subprocess, 'CREATE_NO_WINDOW', 0x08000000)

    # 1. Direct Executable Launch in App Mode (1920x1080 + Maximized)
    for exe in candidates:
        try:
            subprocess.Popen(
                [
                    exe,
                    "--new-window",
                    f"--app={url}",
                    "--window-size=1920,1080",
                    "--start-maximized",
                    "--window-position=0,0"
                ],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                **extra_flags
            )
            return True
        except Exception:
            pass

    # 2. Windows Shell 'start' Command (system resolution)
    if sys.platform == 'win32':
        for browser_cmd in ('msedge', 'chrome'):
            try:
                res = subprocess.run(
                    ["cmd.exe", "/c", "start", browser_cmd, "--new-window", f"--app={url}", "--window-size=1920,1080", "--start-maximized"],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=3,
                    **extra_flags
                )
                if res.returncode == 0:
                    return True
            except Exception:
                pass

    return False

def show_error_dialog(message):
    """Show native Windows message box if on Windows, else print safely."""
    if sys.platform == 'win32':
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, str(message), "DTDC Bill Generator - Error", 0x10)
            return
        except Exception:
            pass
    try:
        sys.stderr.write(f"ERROR: {message}\n")
    except Exception:
        pass

def main():
    global last_heartbeat_time

    web_dir = locate_web_dir()
    if not web_dir:
        show_error_dialog(
            "Offline UI files ('index.html') were not found in bundle.\n\n"
            "Please make sure the web application is built before running."
        )
        return

    server = ThreadedHTTPServer('127.0.0.1', web_dir, port=0)
    server.start()
    port = server.port
    
    # Small buffer to ensure socket is bound and ready to accept connections
    time.sleep(0.3)
    
    local_url = f"http://127.0.0.1:{port}/"
    last_heartbeat_time = time.time() + 60.0  # 60s initial grace period

    # Launch dedicated App Mode window (NO tabs, NO URL bar, NO browser UI)
    launched = False
    if sys.platform == 'win32':
        launched = launch_app_window(local_url)

    if not launched:
        # Fallback only if no Chromium engine was detected
        try:
            webbrowser.open(local_url)
        except Exception:
            pass

    # Server keep-alive loop: stays active as long as app window sends heartbeats
    try:
        while True:
            time.sleep(2)
            # If the user closed the window and no heartbeat is received for 15s, shutdown cleanly
            if time.time() - last_heartbeat_time > 15.0:
                break
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        server.stop()

if __name__ == "__main__":
    main()
