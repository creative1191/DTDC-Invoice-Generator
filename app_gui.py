import os
import sys
import time
import socket
import threading
import functools
import subprocess
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer

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
    """Find a random available port on localhost."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

class OfflineSpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        self.target_dir = directory
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format, *args):
        # Silence console log spam
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].split('#')[0]
        target_path = os.path.join(self.target_dir, clean_path.lstrip('/'))
        
        # If file doesn't exist, fallback to index.html (SPA routing behavior)
        if not os.path.exists(target_path) or os.path.isdir(target_path):
            index_path = os.path.join(self.target_dir, 'index.html')
            if os.path.isfile(index_path):
                self.path = '/index.html'
                
        return super().do_GET()

class ThreadedHTTPServer:
    def __init__(self, host, port, directory):
        self.host = host
        self.port = port
        self.directory = directory
        handler = functools.partial(OfflineSpaHandler, directory=directory)
        self.server = HTTPServer((host, port), handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    def start(self):
        self.thread.start()

    def stop(self):
        try:
            self.server.shutdown()
            self.server.server_close()
        except Exception:
            pass

def launch_app_window(url):
    """Launch in standalone native window (Edge / Chrome App Mode without browser tabs/URL bar)."""
    candidates = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for exe in candidates:
        if os.path.isfile(exe):
            try:
                proc = subprocess.Popen([exe, f"--app={url}", "--window-size=1360,880"])
                return proc
            except Exception:
                pass
    return None

def show_error_dialog(message):
    """Show native Windows message box if on Windows, else print."""
    if sys.platform == 'win32':
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, message, "DTDC Bill Generator - Error", 0x10)
            return
        except Exception:
            pass
    print("ERROR:", message)

def main():
    web_dir = locate_web_dir()
    if not web_dir:
        show_error_dialog(
            "Offline UI files ('index.html') were not found.\n\n"
            "Please make sure the web application is built before running."
        )
        return

    port = find_free_port()
    server = ThreadedHTTPServer('127.0.0.1', port, web_dir)
    server.start()
    local_url = f"http://127.0.0.1:{port}"

    # Try to launch Edge/Chrome in dedicated App Mode
    proc = None
    if sys.platform == 'win32':
        proc = launch_app_window(local_url)

    if proc:
        # Wait until user closes the DTDC app window
        try:
            proc.wait()
        except Exception:
            pass
    else:
        # Fallback to default browser
        webbrowser.open(local_url)
        # Keep background server alive
        try:
            while True:
                time.sleep(2)
        except (KeyboardInterrupt, SystemExit):
            pass

    server.stop()

if __name__ == "__main__":
    main()
