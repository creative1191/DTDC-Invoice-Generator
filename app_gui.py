import os
import sys
import threading
import socket
import functools
from http.server import SimpleHTTPRequestHandler, HTTPServer

def locate_dist_dir():
    """Locate the bundled or local dist folder containing index.html."""
    candidates = []
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
        candidates.append(os.path.join(base_dir, 'dist'))
        candidates.append(base_dir)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
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
        
        # If file doesn't exist, fallback to index.html (SPA behavior)
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

def main():
    dist_dir = locate_dist_dir()
    if not dist_dir:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(
            "DTDC Bill Generator - Error",
            "Offline UI files ('dist/index.html') were not found.\n\n"
            "Please make sure the app is built using 'npm run build' before running."
        )
        return

    port = find_free_port()
    server = ThreadedHTTPServer('127.0.0.1', port, dist_dir)
    server.start()
    local_url = f"http://127.0.0.1:{port}"

    # Try pywebview first for 100% native desktop application experience
    use_webview = False
    try:
        import webview
        use_webview = True
    except ImportError:
        use_webview = False

    if use_webview:
        try:
            window = webview.create_window(
                title="DTDC Bill Generator - Maa Sharda Enterprises",
                url=local_url,
                width=1340,
                height=880,
                min_size=(960, 640),
                confirm_close=False,
                text_select=True,
                zoomable=True
            )
            webview.start(private_mode=False)
            server.stop()
            return
        except Exception as e:
            print(f"pywebview launch note: {e}, falling back to browser controller.")

    # Fallback to default browser + Tkinter controller
    import webbrowser
    webbrowser.open(local_url)

    import tkinter as tk

    root = tk.Tk()
    root.title("DTDC Bill Generator - Maa Sharda Enterprises")
    root.geometry("520x360")
    root.configure(bg="#f8fafc")
    root.resizable(False, False)

    # Header
    header = tk.Frame(root, bg="#0c2340", height=65)
    header.pack(fill="x")
    title_lbl = tk.Label(header, text="DTDC BILL GENERATOR (100% OFFLINE)", font=("Arial", 12, "bold"), fg="#ffffff", bg="#0c2340")
    title_lbl.pack(pady=(12, 2))
    sub_lbl = tk.Label(header, text="MAA SHARDA ENTERPRISES | NAGOD, SATNA", font=("Arial", 9), fg="#93c5fd", bg="#0c2340")
    sub_lbl.pack(pady=(0, 10))

    # Body
    body = tk.Frame(root, bg="#ffffff", padx=20, pady=20, relief="solid", bd=1)
    body.pack(fill="both", expand=True, padx=20, pady=15)

    status_icon = tk.Label(body, text="● SERVER ACTIVE (100% OFFLINE)", font=("Arial", 10, "bold"), fg="#16a34a", bg="#ffffff")
    status_icon.pack(anchor="w")

    url_lbl = tk.Label(body, text=f"Local Offline Address: {local_url}", font=("Courier", 10), fg="#334155", bg="#f1f5f9", padx=8, pady=4)
    url_lbl.pack(fill="x", pady=(8, 15))

    tip_lbl = tk.Label(body, text="✓ No Internet or Wi-Fi required\n✓ Instant 3-Copies Print (Ctrl+P)\n✓ Bold Addresses & Barcode ready", font=("Arial", 9), fg="#475569", bg="#ffffff", justify="left")
    tip_lbl.pack(anchor="w", pady=(0, 15))

    btn_frame = tk.Frame(body, bg="#ffffff")
    btn_frame.pack(fill="x")

    def re_open():
        webbrowser.open(local_url)

    btn_open = tk.Button(btn_frame, text="Re-open in Browser", font=("Arial", 10, "bold"), bg="#0284c7", fg="#ffffff", padx=12, pady=6, cursor="hand2", relief="flat", command=re_open)
    btn_open.pack(side="left", padx=(0, 10))

    def on_close():
        server.stop()
        root.destroy()

    btn_exit = tk.Button(btn_frame, text="Exit App", font=("Arial", 10), bg="#e2e8f0", fg="#334155", padx=12, pady=6, cursor="hand2", relief="flat", command=on_close)
    btn_exit.pack(side="left")

    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()
    server.stop()

if __name__ == "__main__":
    main()
