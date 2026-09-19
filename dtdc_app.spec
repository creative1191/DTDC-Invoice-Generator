# -*- mode: python ; coding: utf-8 -*-
import os
import sys

block_cipher = None

# Collect all files from dist directory
dist_dir = os.path.abspath('dist')
added_files = []
if os.path.isdir(dist_dir):
    for root, dirs, files in os.walk(dist_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_dir = os.path.relpath(root, dist_dir)
            target_sub = os.path.join('dist', rel_dir) if rel_dir != '.' else 'dist'
            added_files.append((full_path, target_sub))

a = Analysis(
    ['app_gui.py'],
    pathex=[],
    binaries=[],
    datas=added_files,
    hiddenimports=[
        'webview',
        'clr',
        'http.server',
        'socket',
        'threading',
        'webbrowser'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='DTDC_Bill_Generator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
