import React from 'react';
import { Printer, FileDown, Image as ImageIcon, FileText } from 'lucide-react';
import { DTDCBillData, CourierConfig } from '../types';

interface BillExportBarProps {
  currentConfig: CourierConfig;
  billData: DTDCBillData;
  isExporting: boolean;
  onDirectPrint: () => void;
  onExportPdf: () => void;
  onExportPng: (highRes: boolean) => void;
  onExportHtml: () => void;
}

export const BillExportBar: React.FC<BillExportBarProps> = React.memo(({
  currentConfig,
  billData,
  isExporting,
  onDirectPrint,
  onExportPdf,
  onExportPng,
  onExportHtml,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2 no-print">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Output Document:</span>
        </span>
        <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
          {currentConfig.shortName} —{' '}
          {billData.layoutMode === '3_COPIES_PORTRAIT'
            ? 'A4 Portrait (3 Copies Stacked)'
            : 'A4 Landscape (Single Page)'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onDirectPrint}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print (Ctrl+P)</span>
        </button>

        <button
          type="button"
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          <span>PDF</span>
        </button>

        <button
          type="button"
          onClick={() => onExportPng(true)}
          disabled={isExporting}
          className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          <span>PNG 300DPI</span>
        </button>

        <button
          type="button"
          onClick={onExportHtml}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>HTML</span>
        </button>
      </div>
    </div>
  );
});
