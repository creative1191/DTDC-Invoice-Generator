import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  FileDown,
  Image as ImageIcon,
  Code2,
  RefreshCw,
  Settings,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  HelpCircle,
  Copy,
  Clock,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { DTDCBillData, PresetLabel, OCRMatchResult } from './types';
import { INITIAL_BILL_DATA, PRESET_LABELS, FREQUENT_CONSIGNORS } from './data/defaults';
import { WindowsTitlebar } from './components/WindowsTitlebar';
import { PrintSheet } from './components/PrintSheet';
import { SnipToolHandler } from './components/SnipToolHandler';
import { PythonBuildExport } from './components/PythonBuildExport';
import { LockedSettingsModal } from './components/LockedSettingsModal';
import { downloadBillAsPdf, downloadBillAsPng, downloadBillAsHtml } from './utils/exportHelpers';

export default function App() {
  const [billData, setBillData] = useState<DTDCBillData>(INITIAL_BILL_DATA);
  const [activeTab, setActiveTab] = useState<'generator' | 'build-files' | 'history'>('generator');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('dharmendra-mehsana-220');

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut Ctrl+P for direct printing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleDirectPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billData]);

  // Direct print handler
  const handleDirectPrint = () => {
    window.print();
  };

  // Field change helper
  const updateField = (field: keyof DTDCBillData, value: any) => {
    setBillData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // OCR extraction callback
  const handleOcrExtracted = (extracted: OCRMatchResult, detectedAwb?: string) => {
    setBillData((prev) => ({
      ...prev,
      awb: extracted.awb || detectedAwb || prev.awb,
      origin: extracted.origin || prev.origin,
      dest: extracted.dest || prev.dest,
      product: extracted.product || prev.product,
      type: extracted.type || prev.type,
      mode: extracted.mode || prev.mode,
      date: extracted.date || prev.date,
      consigneeName: extracted.consigneeName || prev.consigneeName,
      consigneeAddress: extracted.consigneeAddress || prev.consigneeAddress,
      consigneePhone: extracted.consigneePhone || prev.consigneePhone,
      contentSpec: extracted.contentSpec || prev.contentSpec,
      declaredValue: extracted.declaredValue || prev.declaredValue,
      pieces: extracted.pieces || prev.pieces,
      actualWeight: extracted.actualWeight || prev.actualWeight,
      chargedWeight: extracted.chargedWeight || prev.chargedWeight,
      dim: extracted.dim || prev.dim,
      courierCharges: extracted.courierCharges !== undefined ? extracted.courierCharges : prev.courierCharges,
    }));
  };

  // Clear old data button logic (Fixed Point 1 & 9)
  const handleClearOldData = () => {
    setBillData((prev) => ({
      ...prev,
      awb: `7D${Math.floor(100000000 + Math.random() * 900000000)}`,
      customerRefNo: '',
      consigneeName: '',
      consigneeAddress: '',
      consigneePhone: '',
      consigneeGstin: '',
      consigneeEmail: '',
      origin: 'SATNA',
      dest: '',
      contentSpec: '',
      paperworkEnclosed: '',
      declaredValue: 'Not Applicable',
      actualWeight: '',
      chargedWeight: '',
      dim: '10 cm X 10 cm X 10 cm',
      ewaybillNumber: '',
      remark: '',
    }));
  };

  // Preset selector
  const applyPreset = (preset: PresetLabel) => {
    setActivePresetId(preset.id);
    setBillData((prev) => ({
      ...prev,
      ...preset.data,
    }));
  };

  // Apply frequent consignor
  const applyFrequentConsignor = (consignor: { name: string; address: string; phone: string }) => {
    setBillData((prev) => ({
      ...prev,
      consignorName: consignor.name,
      consignorAddress: consignor.address,
      consignorPhone: consignor.phone,
    }));
  };

  // Export handlers
  const handleExportPng = async (highRes = true) => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    setExportNotice(`Generating ${highRes ? '300 DPI High-Res' : 'Standard'} PNG...`);
    try {
      await downloadBillAsPng(printAreaRef.current, billData, highRes);
      setExportNotice('✅ PNG Downloaded Successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Error generating PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    setExportNotice('Compiling print-ready PDF...');
    try {
      await downloadBillAsPdf(printAreaRef.current, billData);
      setExportNotice('✅ PDF Downloaded Successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Error generating PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = () => {
    downloadBillAsHtml(billData);
    setExportNotice('✅ HTML File Downloaded!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-[#1c1d1f] flex flex-col antialiased">
      {/* 1. Windows 11 Native Titlebar */}
      <WindowsTitlebar onPrint={handleDirectPrint} activeLabel={billData.awb} />

      {/* 2. Windows 11 Dashboard Navigation & Status Bar */}
      <div className="bg-[#122b5e] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs no-print">
        {/* Left: Tab navigation */}
        <div className="flex items-center gap-1.5 bg-[#0a1e45] p-1 rounded-lg border border-[#1d3d82]">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bill Generator & Print</span>
          </button>

          <button
            onClick={() => setActiveTab('build-files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'build-files'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Windows EXE & GitHub (build-exe.yml)</span>
          </button>
        </div>

        {/* Center: Live Stats matching dashboard reference */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-[#0c234b] px-3 py-1 rounded-md border border-[#1b3d7a]">
            <span className="text-blue-300 font-semibold text-[10px] uppercase">Option 1</span>
            <span className="font-bold text-white font-mono text-sm">538</span>
            <span className="text-[10px] text-emerald-400 font-medium">BILLS</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0c234b] px-3 py-1 rounded-md border border-[#1b3d7a]">
            <span className="text-blue-300 font-semibold text-[10px] uppercase">Option 2</span>
            <span className="font-bold text-white font-mono text-sm">485</span>
            <span className="text-[10px] text-blue-300 font-medium">DISPATCH</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0c234b] px-3 py-1 rounded-md border border-[#1b3d7a]">
            <span className="text-blue-300 font-semibold text-[10px] uppercase">Option 3</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">45</span>
            <span className="text-[10px] text-emerald-300 font-medium">PAPER-SAVE</span>
          </div>
        </div>

        {/* Right: Weather / Time & Locked Settings Trigger */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-blue-200 bg-[#0a1e45] px-2.5 py-1 rounded border border-[#1d3d82]">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Satna Depot 30°C</span>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer border border-white/10"
            title="Locked Settings & Logo Management"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Locked Rules</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 p-3 md:p-4 max-w-[1920px] w-full mx-auto">
        {/* Tab 2: Windows Build & GitHub Files */}
        {activeTab === 'build-files' && (
          <div className="no-print">
            <PythonBuildExport />
          </div>
        )}

        {/* Tab 1: Primary Bill Generator */}
        {activeTab === 'generator' && (
          <div>
            {/* Top Quick Presets Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-2xs mb-3 flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preset Labels History:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LABELS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        activePresetId === preset.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Mode Selector & Paper Save Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 p-0.5 rounded-md text-xs font-semibold">
                  <button
                    onClick={() => updateField('layoutMode', '3_COPIES_PORTRAIT')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      billData.layoutMode === '3_COPIES_PORTRAIT'
                        ? 'bg-white text-blue-900 shadow-2xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    3 Copies Portrait (A4)
                  </button>
                  <button
                    onClick={() => updateField('layoutMode', 'SINGLE_LANDSCAPE')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      billData.layoutMode === 'SINGLE_LANDSCAPE'
                        ? 'bg-white text-blue-900 shadow-2xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Single Landscape (A4)
                  </button>
                </div>

                {/* Paper Save Mode Checkbox (Point 10 & GUI Fix #5) */}
                {billData.layoutMode === '3_COPIES_PORTRAIT' && (
                  <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billData.paperSaveMode}
                      onChange={(e) => updateField('paperSaveMode', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Paper Save Mode</span>
                  </label>
                )}
              </div>
            </div>

            {/* Split Screen Layout: Editor on Left, Live Print Sheet on Right */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* LEFT COLUMN: Input Form & Controls (5 Cols on xl) */}
              <div className="xl:col-span-5 space-y-3 no-print">
                {/* 1. SnipTool & Clipboard Auto-Detection Handler */}
                <SnipToolHandler
                  onDataExtracted={handleOcrExtracted}
                  onClearOldData={handleClearOldData}
                  currentAwb={billData.awb}
                />

                {/* 2. Sender / Consignor Input Card (Manual Override Priority) */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Consignor Details (Manual Override Active)</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Sender priority rule</span>
                  </div>

                  {/* Frequent consignors quick picker */}
                  <div className="mb-2.5">
                    <div className="text-[10px] font-semibold text-gray-500 mb-1">
                      Quick Pick Consignor:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {FREQUENT_CONSIGNORS.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => applyFrequentConsignor(c)}
                          className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                        >
                          {c.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Consignor Name:
                      </label>
                      <input
                        type="text"
                        value={billData.consignorName}
                        onChange={(e) => updateField('consignorName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                        placeholder="e.g. Dharmendra kumar kushwaha"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Consignor Address:
                      </label>
                      <textarea
                        rows={2}
                        value={billData.consignorAddress}
                        onChange={(e) => updateField('consignorAddress', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-600 resize-none"
                        placeholder="Full address with pin code"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Sender Contact:
                        </label>
                        <input
                          type="text"
                          value={billData.consignorPhone}
                          onChange={(e) => updateField('consignorPhone', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono text-gray-900 focus:outline-none focus:border-blue-600"
                          placeholder="e.g. 0000000000"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Sender Depot:
                        </label>
                        <input
                          type="text"
                          value={billData.senderDepot}
                          onChange={(e) => updateField('senderDepot', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-600"
                          placeholder="e.g. SATNA DEPOT (MP)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                          GSTIN No. (Optional):
                        </label>
                        <input
                          type="text"
                          value={billData.consignorGstin || ''}
                          onChange={(e) => updateField('consignorGstin', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 font-mono text-[11px]"
                          placeholder="GSTIN No"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                          Email (Optional):
                        </label>
                        <input
                          type="email"
                          value={billData.consignorEmail || ''}
                          onChange={(e) => updateField('consignorEmail', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 text-[11px]"
                          placeholder="Email address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Courier Charges (User Rule: Decimal ke baad double zero by default) */}
                <div className="bg-yellow-50/70 border-2 border-yellow-400/80 rounded-lg p-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                      <span>Courier Charges (Standard 2 Decimals by Default)</span>
                    </span>
                    <span className="text-[10px] font-bold text-yellow-800 bg-yellow-200 px-1.5 py-0.2 rounded">
                      ₹.00 FORMAT
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-black rounded bg-white px-3 py-1 flex-1">
                      <span className="font-bold text-sm text-gray-700 mr-2">Courier Charges: ₹</span>
                      <input
                        type="text"
                        value={billData.courierCharges}
                        onChange={(e) => updateField('courierCharges', e.target.value)}
                        onBlur={() => {
                          const num = parseFloat(String(billData.courierCharges).replace(/[^0-9.]/g, ''));
                          if (!isNaN(num)) {
                            updateField('courierCharges', num.toFixed(2));
                          } else {
                            updateField('courierCharges', '0.00');
                          }
                        }}
                        className="w-full font-black text-lg font-mono text-black focus:outline-none"
                        placeholder="220.00"
                      />
                    </div>
                    <div className="flex gap-1">
                      {['140.00', '220.00', '950.00'].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => updateField('courierCharges', rate)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded cursor-pointer transition-colors border ${
                            String(billData.courierCharges) === rate || Number(billData.courierCharges) === Number(rate)
                              ? 'bg-yellow-400 border-yellow-600 text-black'
                              : 'bg-white hover:bg-yellow-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          ₹{rate}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Default decimal formatting: "Courier Charges: ₹ {typeof billData.courierCharges === 'number' ? billData.courierCharges.toFixed(2) : billData.courierCharges}"
                  </p>
                </div>

                {/* 4. Consignee Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Consignee Details (Recipient)</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                      DEST: {billData.dest || 'MEHSANA'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Consignee Name:
                      </label>
                      <input
                        type="text"
                        value={billData.consigneeName}
                        onChange={(e) => updateField('consigneeName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                        placeholder="e.g. Mantra softech india pvt ltd"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Consignee Address:
                      </label>
                      <textarea
                        rows={2}
                        value={billData.consigneeAddress}
                        onChange={(e) => updateField('consigneeAddress', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-600 resize-none"
                        placeholder="e.g. LS no 2376/1A, MEHSANA, GUJARAT, 384440"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Recipient Contact:
                        </label>
                        <input
                          type="text"
                          value={billData.consigneePhone}
                          onChange={(e) => updateField('consigneePhone', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono text-gray-900 focus:outline-none focus:border-blue-600"
                          placeholder="e.g. 0000000000"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Destination City:
                        </label>
                        <input
                          type="text"
                          value={billData.dest}
                          onChange={(e) => updateField('dest', e.target.value.toUpperCase())}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-bold text-blue-900 uppercase focus:outline-none focus:border-blue-600"
                          placeholder="e.g. MEHSANA, KOTA, TRICHUR"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                          Customer Ref No:
                        </label>
                        <input
                          type="text"
                          value={billData.customerRefNo || ''}
                          onChange={(e) => updateField('customerRefNo', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 font-mono text-[11px]"
                          placeholder="Ref #"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                          GSTIN No.:
                        </label>
                        <input
                          type="text"
                          value={billData.consigneeGstin || ''}
                          onChange={(e) => updateField('consigneeGstin', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 font-mono text-[11px]"
                          placeholder="GSTIN No"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                          Email:
                        </label>
                        <input
                          type="email"
                          value={billData.consigneeEmail || ''}
                          onChange={(e) => updateField('consigneeEmail', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 text-[11px]"
                          placeholder="Email"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Shipment & Route Specifications */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <span className="font-bold text-gray-900">Shipment Technical Specs</span>
                    <span className="text-[10px] text-gray-500 font-mono">AWB: {billData.awb}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        AWB No:
                      </label>
                      <input
                        type="text"
                        value={billData.awb}
                        onChange={(e) => updateField('awb', e.target.value.toUpperCase())}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Origin:
                      </label>
                      <input
                        type="text"
                        value={billData.origin}
                        onChange={(e) => updateField('origin', e.target.value.toUpperCase())}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Mode:
                      </label>
                      <select
                        value={billData.mode}
                        onChange={(e) => updateField('mode', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-bold bg-white"
                      >
                        <option value="SURFACE">SURFACE</option>
                        <option value="AIR">AIR</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Product:
                      </label>
                      <input
                        type="text"
                        value={billData.product}
                        onChange={(e) => updateField('product', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Type:
                      </label>
                      <select
                        value={billData.type}
                        onChange={(e) => updateField('type', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 bg-white font-semibold"
                      >
                        <option value="NON-DOCUMENT">NON-DOCUMENT</option>
                        <option value="DOCUMENT">DOCUMENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Date:
                      </label>
                      <input
                        type="text"
                        value={billData.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Content:
                      </label>
                      <input
                        type="text"
                        value={billData.contentSpec}
                        onChange={(e) => updateField('contentSpec', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Pieces:
                      </label>
                      <input
                        type="text"
                        value={billData.pieces}
                        onChange={(e) => updateField('pieces', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Declared Value:
                      </label>
                      <input
                        type="text"
                        value={billData.declaredValue}
                        onChange={(e) => updateField('declaredValue', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Actual Weight:
                      </label>
                      <input
                        type="text"
                        value={billData.actualWeight}
                        onChange={(e) => updateField('actualWeight', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Charged Weight:
                      </label>
                      <input
                        type="text"
                        value={billData.chargedWeight}
                        onChange={(e) => updateField('chargedWeight', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Dimensions:
                      </label>
                      <input
                        type="text"
                        value={billData.dim}
                        onChange={(e) => updateField('dim', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Paperwork Enclosed:
                      </label>
                      <input
                        type="text"
                        value={billData.paperworkEnclosed || ''}
                        onChange={(e) => updateField('paperworkEnclosed', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-[11px]"
                        placeholder="e.g. INVOICE / DC"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Ewaybill Number:
                      </label>
                      <input
                        type="text"
                        value={billData.ewaybillNumber || ''}
                        onChange={(e) => updateField('ewaybillNumber', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono text-[11px]"
                        placeholder="e.g. 123456789012"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Booking Center / Branch & Risk Surcharge (as shown in layout image) */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-900">Booking Center & Risk Surcharge</span>
                    <span className="text-[10px] text-gray-500 font-mono">{billData.bookingBranchName || 'Branch'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Branch Name:
                      </label>
                      <input
                        type="text"
                        value={billData.bookingBranchName || ''}
                        onChange={(e) => updateField('bookingBranchName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-semibold text-[11px]"
                        placeholder="MAA SHARDA ENTERPRISES"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Branch Phone:
                      </label>
                      <input
                        type="text"
                        value={billData.bookingBranchPhone || ''}
                        onChange={(e) => updateField('bookingBranchPhone', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 font-mono text-[11px]"
                        placeholder="8982091190"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                      Branch Address:
                    </label>
                    <input
                      type="text"
                      value={billData.bookingBranchAddress || ''}
                      onChange={(e) => updateField('bookingBranchAddress', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-[11px]"
                      placeholder="NEAR REST HOUSE, NAGOD, SATNA, MADHYA PRADESH 485446"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 items-center">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                        Risk Surcharge:
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={billData.riskSurchargeOwner}
                            onChange={(e) => updateField('riskSurchargeOwner', e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          <span>Owner [✓]</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={billData.riskSurchargeCarrier}
                            onChange={(e) => updateField('riskSurchargeCarrier', e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          <span>Carrier</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                        Remark:
                      </label>
                      <input
                        type="text"
                        value={billData.remark || ''}
                        onChange={(e) => updateField('remark', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-[11px]"
                        placeholder="Optional remark"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Real-Time Preview & Quick Export Toolbar (7 Cols on xl) */}
              <div className="xl:col-span-7 space-y-3">
                {/* Export Action Bar (Always Visible at Top of Preview) */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2 no-print">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Output Document:</span>
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-600">
                      {billData.layoutMode === '3_COPIES_PORTRAIT'
                        ? 'A4 Portrait (3 Copies Stacked)'
                        : 'A4 Landscape (Single Page)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Direct Print Button */}
                    <button
                      onClick={handleDirectPrint}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print (Ctrl+P)</span>
                    </button>

                    {/* Download PDF Button */}
                    <button
                      onClick={handleExportPdf}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>PDF</span>
                    </button>

                    {/* Download High-Res PNG */}
                    <button
                      onClick={() => handleExportPng(true)}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>PNG 300DPI</span>
                    </button>

                    {/* Download HTML */}
                    <button
                      onClick={handleExportHtml}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>HTML</span>
                    </button>
                  </div>
                </div>

                {/* Export notification badge */}
                {exportNotice && (
                  <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded text-xs font-semibold flex items-center justify-between no-print animate-fadeIn">
                    <span>{exportNotice}</span>
                    <span className="text-[10px] text-blue-600">DTDC System</span>
                  </div>
                )}

                {/* PREVIEW CONTAINER: EXACT A4 CANVAS */}
                <div className="bg-[#e4e7ee] p-2 md:p-4 rounded-xl border border-gray-300 shadow-inner overflow-x-auto flex justify-center">
                  <PrintSheet
                    data={billData}
                    customLogoUrl={customLogoUrl}
                    sheetRef={printAreaRef}
                  />
                </div>

                {/* Bottom Verification Note & Locked Confirmation */}
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 text-[11px] text-gray-600 flex items-center justify-between no-print">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Original DTDC layout preserved: Code128 barcode, 200x92mm copies, POD signature block & custom logo active.
                    </span>
                  </div>
                  <span className="font-mono text-gray-500 font-semibold">my_dtdc_settings.json locked</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Locked Settings Modal */}
      <LockedSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        customLogoUrl={customLogoUrl}
        onLogoUpload={(url) => setCustomLogoUrl(url)}
      />
    </div>
  );
}
