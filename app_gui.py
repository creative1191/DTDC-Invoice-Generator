import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox
import webbrowser

def main():
    root = tk.Tk()
    root.title("DTDC Bill Generator - Maa Sharda Enterprises")
    root.geometry("600x480")
    root.configure(bg="#f3f4f6")

    # Header
    header = tk.Frame(root, bg="#0c2340", height=70)
    header.pack(fill="x")

    title_label = tk.Label(header, text="DTDC BILL GENERATOR", font=("Arial", 16, "bold"), fg="#ffffff", bg="#0c2340")
    title_label.pack(pady=(12, 2))

    branch_label = tk.Label(header, text="MAA SHARDA ENTERPRISES | NAGOD, SATNA", font=("Arial", 9), fg="#93c5fd", bg="#0c2340")
    branch_label.pack(pady=(0, 10))

    # Main Card
    card = tk.Frame(root, bg="#ffffff", padx=20, pady=20, relief="groove", bd=1)
    card.pack(fill="both", expand=True, padx=20, pady=20)

    info_head = tk.Label(card, text="Windows Native Desktop App & Web App", font=("Arial", 12, "bold"), fg="#111827", bg="#ffffff")
    info_head.pack(anchor="w", pady=(0, 10))

    details = [
        "1. Instant Print Ready: 3 Copies Portrait (A4) & Paper Save Mode",
        "2. Authentic DTDC Layout with Bold Address Format & Barcode",
        "3. Real-time Courier Charges formatted strictly to 2 decimal places",
        "4. Auto-generated AWB numbers with Code128 barcoding"
    ]

    for d in details:
        lbl = tk.Label(card, text=d, font=("Arial", 10), fg="#374151", bg="#ffffff")
        lbl.pack(anchor="w", pady=3)

    sep = ttk.Separator(card, orient="horizontal")
    sep.pack(fill="x", pady=15)

    def open_web():
        webbrowser.open("https://ais-pre-ldkdqxgwtflic5uiws5q6v-162010267032.asia-southeast1.run.app")

    btn_launch = tk.Button(card, text="Open Full DTDC Generator", font=("Arial", 11, "bold"), bg="#0284c7", fg="#ffffff", padx=15, pady=8, cursor="hand2", command=open_web, relief="flat")
    btn_launch.pack(pady=10)

    lbl_tip = tk.Label(card, text="Tip: Press Ctrl+P on the generator window for instant 3-Copies A4 Printing.", font=("Arial", 9, "italic"), fg="#6b7280", bg="#ffffff")
    lbl_tip.pack()

    root.mainloop()

if __name__ == "__main__":
    main()
