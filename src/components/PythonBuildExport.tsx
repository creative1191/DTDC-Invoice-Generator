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
      title: 'GitHub Actions Workflow (Only Windows EXE)',
      description: 'Automatically builds DTDC_Bill_Generator.exe on GitHub Cloud with Python 3.11 & PyInstaller',
      content: `name: Build DTDC EXE
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install reportlab python-barcode Pillow pyinstaller customtkinter

      - name: Build Windows Executable
        run: |
          pyinstaller --onefile --windowed --name DTDC_Bill_Generator --add-data "assets;assets" --add-data "generator;generator" --collect-all barcode --hidden-import=barcode --hidden-import=barcode.writer --hidden-import=generator --hidden-import=generator.dtdc_generator --hidden-import=reportlab --hidden-import=PIL --hidden-import=customtkinter app_gui.py --clean -y

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: DTDC_Bill_Generator-Windows-EXE
          path: dist/DTDC_Bill_Generator.exe
`,
    },
    bat: {
      filename: 'build_exe_windows.bat',
      title: 'Local Windows Build Batch Script',
      description: 'Double-click to compile DTDC_Bill_Generator.exe locally on your Windows PC',
      content: `@echo off
echo ========================================================
echo       DTDC Bill Generator - Windows EXE Builder
echo ========================================================
echo Installing required packages...
pip install reportlab python-barcode Pillow pyinstaller customtkinter

echo.
echo Building Standalone Windows Executable (.exe)...
pyinstaller --onefile --windowed --name DTDC_Bill_Generator ^
  --add-data "assets;assets" ^
  --add-data "generator;generator" ^
  --collect-all barcode ^
  --hidden-import=barcode ^
  --hidden-import=barcode.writer ^
  --hidden-import=generator ^
  --hidden-import=generator.dtdc_generator ^
  --hidden-import=reportlab ^
  --hidden-import=PIL ^
  --hidden-import=customtkinter ^
  app_gui.py --clean -y

echo.
echo ========================================================
echo  BUILD COMPLETE! Check: dist\\DTDC_Bill_Generator.exe
echo ========================================================
pause
`,
    },
    requirements: {
      filename: 'requirements.txt',
      title: 'Unpinned Requirements for PyInstaller',
      description: 'Ensures zero version conflicts on Windows Python 3.11',
      content: `reportlab
python-barcode
Pillow
pyinstaller
customtkinter
`,
    },
    gui: {
      filename: 'app_gui.py',
      title: 'GUI V8 - Premium Windows 11 Desktop Code',
      description: 'Features SnipTool Win+Shift+S paste, CTkScrollableFrame, Paper Save Mode & Direct Print',
      content: `"""
DTDC Bill Generator - Premium Windows 11 GUI V8
With SnipTool Clipboard Auto-Detect, CTkScrollableFrame, and Paper Save Mode
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime

try:
    import customtkinter as ctk
    from PIL import Image, ImageTk, ImageGrab
except ImportError:
    import tkinter as ctk
    from tkinter import messagebox
    print("Running in standard Tkinter fallback mode")

# Core GUI implementation handles:
# 1. Clipboard SnipTool paste (Ctrl+V)
# 2. Direct print with os.startfile(print) fallback
# 3. Paper save mode (only Sender copy filled)
# 4. Barcode Code128 generation with ReportLab
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
