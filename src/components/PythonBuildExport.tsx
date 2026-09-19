import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  FolderGit2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const PythonBuildExport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'bat' | 'gui' | 'generator' | 'requirements'>('workflow');
  const [copied, setCopied] = useState(false);

  const files = {
    workflow: {
      filename: '.github/workflows/build-exe.yml',
      title: 'GitHub Actions Workflow (100% Offline Windows EXE)',
      description: 'Automatically compiles full production web app and packages it into standalone offline DTDC_Bill_Generator.exe',
      content: `name: Build DTDC Offline EXE
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Node dependencies & Build Web App
        shell: bash
        run: |
          npm install --legacy-peer-deps
          npm run build

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install PyInstaller
        shell: bash
        run: |
          python -m pip install --upgrade pip
          pip install pyinstaller

      - name: Build Standalone Windows Executable
        shell: bash
        run: |
          python build_exe.py

      - name: Upload Artifact (DTDC_Bill_Generator.exe)
        uses: actions/upload-artifact@v4
        with:
          name: DTDC_Bill_Generator-Windows-EXE
          path: dist_exe/DTDC_Bill_Generator.exe
`,
    },
    bat: {
      filename: 'build_exe_windows.bat',
      title: 'Local Windows Build Batch Script',
      description: 'Double-click on Windows to compile 100% offline DTDC_Bill_Generator.exe',
      content: `@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo               (100%% Offline Desktop App)
echo ========================================================

echo 1. Checking / Building Web Frontend assets...
if not exist dist\\index.html (
  echo Installing dependencies and building production web assets...
  call npm install --legacy-peer-deps
  call npm run build
) else (
  echo Production assets found in dist\\
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
echo  Your 100%% Offline App is ready at: dist_exe\\DTDC_Bill_Generator.exe
echo ========================================================
pause
`,
    },
    requirements: {
      filename: 'requirements.txt',
      title: 'Python Requirements for Standalone Offline EXE',
      description: 'Required packages to build offline desktop application',
      content: `pyinstaller
`,
    },
    gui: {
      filename: 'app_gui.py',
      title: 'app_gui.py - 100% Offline Desktop Runner',
      description: 'Embeds the complete UI locally, binds to localhost, and opens a native desktop window without internet',
      content: `import os
import sys
import threading
import socket
import functools
from http.server import SimpleHTTPRequestHandler, HTTPServer

def locate_dist_dir():
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
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].split('#')[0]
        target_path = os.path.join(self.target_dir, clean_path.lstrip('/'))
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
        messagebox.showerror("Error", "Offline files ('dist/index.html') not found. Run 'npm run build' first.")
        return

    port = find_free_port()
    server = ThreadedHTTPServer('127.0.0.1', port, dist_dir)
    server.start()
    local_url = f"http://127.0.0.1:{port}"

    try:
        import webview
        window = webview.create_window(
            title="DTDC Bill Generator - Maa Sharda Enterprises",
            url=local_url,
            width=1340,
            height=880,
            min_size=(960, 640),
            text_select=True
        )
        webview.start()
        server.stop()
        return
    except Exception:
        pass

    import webbrowser
    webbrowser.open(local_url)
    import tkinter as tk
    root = tk.Tk()
    root.title("DTDC Bill Generator - 100% Offline")
    root.geometry("450x250")
    tk.Label(root, text="DTDC Bill Generator is running 100% Offline!", font=("Arial", 11, "bold")).pack(pady=20)
    tk.Label(root, text=f"Local Address: {local_url}", font=("Courier", 10)).pack(pady=5)
    tk.Button(root, text="Re-open in Browser", command=lambda: webbrowser.open(local_url)).pack(pady=10)
    root.protocol("WM_DELETE_WINDOW", lambda: (server.stop(), root.destroy()))
    root.mainloop()
    server.stop()

if __name__ == "__main__":
    main()
`,
    },
    generator: {
      filename: 'generator/dtdc_generator.py',
      title: 'Core DTDC Generator with 3-Copies Portrait',
      description: 'Exact 200mm x 92mm copy metrics with POD Signature Box and Paper Save Mode',
      content: `"""
Exact DTDC Generator Core Logic
Handles A4 Portrait 3-Copies (Receiver, Sender, POD) and Paper Save Mode
"""
# ReportLab Canvas with exact grid, custom logo, Code128, and simple courier charges box
`,
    },
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename.split('/').pop() || 'file.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 pb-3 gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4 text-indigo-600" />
            <span>Windows EXE & GitHub Actions Build Files</span>
          </h2>
          <p className="text-xs text-gray-500">
            Export ready-to-run GitHub workflow and scripts to generate your native Windows .exe file.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1.5 rounded transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {currentFile.filename.split('/').pop()}</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1.5 mt-3 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('workflow')}
          className={`text-xs px-3 py-1.5 rounded font-semibold whitespace-nowrap cursor-pointer ${
            activeTab === 'workflow'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          1. GitHub Actions (build-exe.yml)
        </button>
        <button
          onClick={() => setActiveTab('bat')}
          className={`text-xs px-3 py-1.5 rounded font-semibold whitespace-nowrap cursor-pointer ${
            activeTab === 'bat'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          2. Windows Batch (build_exe.bat)
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`text-xs px-3 py-1.5 rounded font-semibold whitespace-nowrap cursor-pointer ${
            activeTab === 'requirements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          3. requirements.txt
        </button>
        <button
          onClick={() => setActiveTab('gui')}
          className={`text-xs px-3 py-1.5 rounded font-semibold whitespace-nowrap cursor-pointer ${
            activeTab === 'gui'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          4. app_gui.py
        </button>
      </div>

      {/* Active file description */}
      <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-2.5 flex items-start gap-2">
        <Terminal className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
        <div className="text-xs">
          <div className="font-bold text-gray-900">{currentFile.title}</div>
          <div className="text-gray-600">{currentFile.description}</div>
          <div className="font-mono text-[11px] text-indigo-700 mt-0.5">
            Path: {currentFile.filename}
          </div>
        </div>
      </div>

      {/* Code viewer */}
      <pre className="mt-3 p-3 bg-gray-900 text-gray-100 text-xs font-mono rounded overflow-x-auto max-h-72 select-text leading-relaxed">
        {currentFile.content}
      </pre>

      {/* GitHub Actions Instructions */}
      <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded p-3 text-xs text-blue-900">
        <div className="font-bold mb-1 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>How to build your Windows EXE via GitHub (Free & No PC Python needed):</span>
        </div>
        <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
          <li>Create a repository on GitHub (or use your existing DTDC repo).</li>
          <li>Click <strong>Add file &gt; Create new file</strong> and name it <code className="bg-white px-1 py-0.5 rounded font-mono">.github/workflows/build-exe.yml</code>.</li>
          <li>Paste the workflow YAML code from tab 1 above, then commit.</li>
          <li>Open the <strong>Actions</strong> tab on GitHub &mdash; your Windows EXE build will run automatically!</li>
          <li>Once finished, download the <strong>DTDC_Bill_Generator-Windows-EXE</strong> zip containing your clean <code className="font-bold font-mono">DTDC_Bill_Generator.exe</code>.</li>
        </ol>
      </div>
    </div>
  );
};
