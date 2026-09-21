import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Printer,
  FileDown,
  Trash2,
  RotateCw,
  MoveLeft,
  MoveRight,
  ClipboardPaste,
  FileText,
  Sparkles,
  Layers,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Plus,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { extractPagesFromPdf, extractFromImageFile } from '../../utils/pdfLabelExtractor';
import { exportLabelsToA4Pdf, ExportableLabelItem } from '../../utils/pdfLabelExport';
import { getInitialSampleLabels } from '../../utils/sampleLabels';
import { A4LabelSheet } from './A4LabelSheet';

export const LabelPrintingManager: React.FC = () => {
  const [labels, setLabels] = useState<ExportableLabelItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [showCutLines, setShowCutLines] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Process incoming files (images or PDFs)
  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProcessingStatus('Reading uploaded files...');

    const newItems: ExportableLabelItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          setProcessingStatus(`Analyzing PDF: ${file.name}...`);
          const extractedPages = await extractPagesFromPdf(file, (current, total) => {
            setProcessingStatus(`Extracting page ${current} of ${total} from ${file.name}...`);
          });

          extractedPages.forEach((p) => {
            newItems.push({
              id: p.id,
              dataUrl: p.dataUrl,
              width: p.width,
              height: p.height,
              rotation: 0,
              title: p.sourceName,
            });
          });
        } else if (file.type.startsWith('image/')) {
          setProcessingStatus(`Processing image: ${file.name}...`);
          const item = await extractFromImageFile(file, file.name);
          newItems.push({
            id: item.id,
            dataUrl: item.dataUrl,
            width: item.width,
            height: item.height,
            rotation: 0,
            title: item.sourceName,
          });
        }
      }

      if (newItems.length > 0) {
        setLabels((prev) => [...prev, ...newItems]);
        showToast(`✅ Added ${newItems.length} shipping label${newItems.length > 1 ? 's' : ''}!`);
      } else {
        showToast('⚠️ No valid images or PDF files found.');
      }
    } catch (err: any) {
      console.error('Error processing files:', err);
      showToast(`❌ Error: ${err.message || 'Failed to read files'}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  }, []);

  // Global Ctrl+V Clipboard paste listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      let foundImage = false;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            foundImage = true;
            setIsProcessing(true);
            setProcessingStatus('Processing pasted Snipping Tool image...');

            try {
              const labelItem = await extractFromImageFile(
                blob,
                `Snipping Tool Paste (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
              );
              setLabels((prev) => [
                ...prev,
                {
                  id: labelItem.id,
                  dataUrl: labelItem.dataUrl,
                  width: labelItem.width,
                  height: labelItem.height,
                  rotation: 0,
                  title: labelItem.sourceName,
                },
              ]);
              showToast('✅ Label pasted from clipboard (Ctrl+V)!');
            } catch (err) {
              console.error(err);
              showToast('❌ Failed to process pasted image.');
            } finally {
              setIsProcessing(false);
              setProcessingStatus(null);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Queue actions
  const handleRemove = (id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const handleRotate = (id: string) => {
    setLabels((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const newRot = ((l.rotation || 0) + 90) % 360;
          return { ...l, rotation: newRot };
        }
        return l;
      })
    );
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= labels.length) return;

    setLabels((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleClearAll = () => {
    if (labels.length === 0) return;
    if (window.confirm('Clear all queued shipping labels?')) {
      setLabels([]);
      showToast('Queue cleared.');
    }
  };

  const handleLoadSamples = () => {
    const samples = getInitialSampleLabels();
    setLabels(samples);
    showToast('✅ 4 sample shipping labels loaded into A4 2x2 grid!');
  };

  // Print execution: window.print() triggers standard CSS print media rules
  const handlePrint = () => {
    if (labels.length === 0) {
      showToast('⚠️ Please upload or paste at least one label first.');
      return;
    }
    window.print();
  };

  // Export to multi-page A4 PDF
  const handleExportPdf = async () => {
    if (labels.length === 0) {
      showToast('⚠️ No labels to export.');
      return;
    }

    setIsExportingPdf(true);
    showToast('Compiling multi-page A4 PDF with 2x2 grid...');

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      await exportLabelsToA4Pdf(labels, `Shipping-Labels-4Up-${timestamp}.pdf`, showCutLines);
      showToast('✅ PDF downloaded successfully!');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showToast('❌ Failed to create PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Calculation of sheets: 4 labels per sheet
  const labelsPerPage = 4;
  const totalSheets = Math.max(1, Math.ceil(labels.length / labelsPerPage));

  // Chunk labels into groups of 4 for each sheet
  const sheetsData = Array.from({ length: totalSheets }).map((_, sheetIdx) => {
    const start = sheetIdx * labelsPerPage;
    const pageLabels = labels.slice(start, start + labelsPerPage);
    // Pad to exactly 4 slots (filled with label or null)
    const slots: (ExportableLabelItem | null)[] = [
      pageLabels[0] || null,
      pageLabels[1] || null,
      pageLabels[2] || null,
      pageLabels[3] || null,
    ];
    return slots;
  });

  return (
    <div className="space-y-4">
      {/* 1. TOP CONTROL BAR (Screen Only) */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs no-print flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title and Sheet Counter */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                A4 4-Up Label Printing
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                2x2 Vertical Grid
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Standard A4 portrait (210×297mm) • 4 shipping labels per sheet • Auto-multi-page PDF splitting
            </p>
          </div>
        </div>

        {/* Center: Live Counts */}
        <div className="flex items-center gap-2 text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <span className="text-gray-500 font-medium">Queued Labels:</span>
          <span className="font-bold text-emerald-700 font-mono text-sm">{labels.length}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 font-medium">A4 Sheets:</span>
          <span className="font-bold text-blue-700 font-mono text-sm">
            {labels.length === 0 ? 0 : totalSheets}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtle Cut Lines Toggle */}
          <button
            onClick={() => setShowCutLines(!showCutLines)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer ${
              showCutLines
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
            title="Toggle dashed cutting / peel guide lines"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{showCutLines ? 'Cut Guides: ON' : 'Cut Guides: OFF'}</span>
          </button>

          {/* Sample Labels Button */}
          <button
            onClick={handleLoadSamples}
            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg border border-gray-300 transition-colors cursor-pointer"
            title="Load 4 realistic sample courier labels for quick preview"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample 4-Up</span>
          </button>

          {/* Clear All */}
          {labels.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
              title="Clear all labels from queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          {/* Download PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={labels.length === 0 || isExportingPdf}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all border ${
              labels.length === 0 || isExportingPdf
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-2xs hover:border-gray-400 cursor-pointer'
            }`}
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          {/* Primary Print Labels Button */}
          <button
            onClick={handlePrint}
            disabled={labels.length === 0}
            className={`flex items-center gap-2 text-xs px-4 py-1.5 rounded-lg font-bold shadow-sm transition-all border ${
              labels.length === 0
                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 cursor-pointer active:scale-98'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print Labels ({labels.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-blue-500 hover:text-blue-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. DEDICATED INPUT & UPLOAD SECTION (Screen Only) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 no-print">
        {/* Left Dropzone (5 cols) */}
        <div className="xl:col-span-5 space-y-3">
          <div
            ref={dropzoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDraggingOver
                ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 shadow-2xs'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFiles(e.target.files);
                  e.target.value = ''; // Reset input to allow re-uploading same file
                }
              }}
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              className="hidden"
            />

            {/* Content inside Dropzone */}
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <span className="font-bold text-sm text-gray-800 block">
                  Drop Labels Here or Click to Upload
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Supports <strong>PNG, JPG, JPEG, WEBP</strong> and <strong>Multi-Page PDF</strong>
                </span>
              </div>

              {/* Windows Snipping Tool Ctrl+V Highlight */}
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <ClipboardPaste className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Or press <kbd className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono text-[11px] shadow-2xs">Ctrl + V</kbd> to paste from Snipping Tool</span>
              </div>

              {/* Multi-page PDF note */}
              <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Multi-page PDFs automatically split into individual 4-up labels</span>
              </div>
            </div>

            {/* Processing Spinner Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4 z-20">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <span className="font-bold text-xs text-gray-800">{processingStatus || 'Processing...'}</span>
                <span className="text-[11px] text-gray-500 mt-1">Please wait a moment</span>
              </div>
            )}
          </div>

          {/* Quick Instructions & Help Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-xs text-gray-600 shadow-2xs space-y-2">
            <div className="font-bold text-gray-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>How 4-Up Grid Printing Works:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-600">
              <li>
                <strong>2x2 Grid (4 labels / A4 sheet):</strong> Slot 1 (Top-Left), Slot 2 (Top-Right), Slot 3 (Bottom-Left), Slot 4 (Bottom-Right).
              </li>
              <li>
                <strong>Zero Filler / No Dummy Labels:</strong> Only the exact labels you add will be printed. Unused slots remain completely empty without wasting ink.
              </li>
              <li>
                <strong>Snipping Tool (Win+Shift+S):</strong> Snip any label from portal, press <code>Ctrl+V</code>, and it automatically drops into the next available slot!
              </li>
              <li>
                <strong>Orientation:</strong> Use the rotate button (<RotateCw className="w-3 h-3 inline text-blue-600" />) on any thumbnail if a label needs 90° rotation.
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Queued Labels Thumbnail Gallery (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-gray-800">
                Queue Gallery ({labels.length})
              </span>
              {labels.length > 0 && (
                <span className="text-[11px] text-gray-500 font-mono">
                  {Math.ceil(labels.length / 4)} Sheet{Math.ceil(labels.length / 4) > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500">
              Order: Slot 1 → Slot 2 → Slot 3 → Slot 4
            </div>
          </div>

          {/* Thumbnail Gallery Grid */}
          {labels.length === 0 ? (
            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-600">No labels in queue</span>
              <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm">
                Paste snipped images via <kbd className="bg-gray-100 px-1 rounded text-gray-600">Ctrl+V</kbd>, drag & drop files, or click <strong>Load Sample 4-Up</strong> above to test immediately.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto p-1">
              {labels.map((item, index) => {
                const sheetNumber = Math.floor(index / 4) + 1;
                const slotInSheet = (index % 4) + 1;
                const rotation = item.rotation || 0;

                return (
                  <div
                    key={item.id}
                    className="relative group bg-gray-50 rounded-lg border border-gray-200 p-2 flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="bg-gray-800 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                        #{index + 1}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">
                        S{sheetNumber}:Slot {slotInSheet}
                      </span>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="w-full h-28 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center p-1 relative">
                      <img
                        src={item.dataUrl}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain transition-transform"
                        style={{
                          transform: rotation ? `rotate(${rotation}deg)` : undefined,
                        }}
                      />
                    </div>

                    {/* Label Title */}
                    <div className="mt-1.5 truncate text-[10px] font-medium text-gray-700" title={item.title}>
                      {item.title}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-gray-200 text-gray-600">
                      {/* Move Left */}
                      <button
                        onClick={() => handleMove(index, 'left')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-700 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Earlier in Queue"
                      >
                        <MoveLeft className="w-3 h-3" />
                      </button>

                      {/* Rotate 90 deg */}
                      <button
                        onClick={() => handleRotate(item.id)}
                        className="p-1 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
                        title={`Rotate 90° (Current: ${rotation}°)`}
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>

                      {/* Move Right */}
                      <button
                        onClick={() => handleMove(index, 'right')}
                        disabled={index === labels.length - 1}
                        className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-700 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Later in Queue"
                      >
                        <MoveRight className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                        title="Remove Label"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. A4 4-UP PRINT SHEETS (Visible both on screen preview and print) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print px-1">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="font-bold text-xs text-gray-800 uppercase tracking-wide">
              Live A4 Sheet Preview ({totalSheets} Page{totalSheets > 1 ? 's' : ''})
            </span>
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Sheet Paper: A4 Portrait (210mm x 297mm)
          </div>
        </div>

        {/* Outer preview stage: Styled for screen, stripped clean in @media print */}
        <div className="label-print-stage bg-[#d9dde6] print:bg-white p-3 md:p-6 rounded-2xl border border-gray-300 print:border-none print:p-0 shadow-inner flex flex-col items-center space-y-6 print:space-y-0 overflow-x-auto">
          {labels.length === 0 ? (
            <div className="no-print bg-white rounded-xl border border-gray-300 p-8 text-center max-w-md my-8 shadow-sm">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-gray-800 mb-1">
                A4 4-Up Layout Ready
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Upload or paste shipping labels to see them dynamically placed into Slot 1, Slot 2, Slot 3, and Slot 4 of standard A4 paper.
              </p>
              <button
                onClick={handleLoadSamples}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Load 4 Sample Labels to Test</span>
              </button>
            </div>
          ) : (
            sheetsData.map((slots, sheetIdx) => (
              <div key={`sheet-${sheetIdx}`} className="print-page-wrapper">
                <A4LabelSheet
                  sheetIndex={sheetIdx}
                  totalSheets={totalSheets}
                  slots={slots}
                  showCutLines={showCutLines}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
