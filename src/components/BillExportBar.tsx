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
  onUpdateField?: (field: keyof DTDCBillData, value: any) => void;
}

export const BillExportBar: React.FC<BillExportBarProps> = React.memo(({
  currentConfig,
  billData,
  isExporting,
  onDirectPrint,
  onExportPdf,
  onExportPng,
  onExportHtml,
  onUpdateField,
}) => {
  const currentMargin = billData.printMargin || 'normal';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 no-print">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Output Document:</span>
        </span>
        <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
          {currentConfig.shortName} —{' '}
          {billData.layoutMode === '3_COPIES_PORTRAIT'
            ? 'A4 Portrait (3 Copies)'
            : 'A4 Landscape (Single Page)'}
        </span>

        {/* Print Margin selector */}
        {onUpdateField && (
          <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md p-0.5 text-[11px]">
            <span className="text-gray-500 px-1 font-medium">Margin:</span>
            <button
              type="button"
              onClick={() => onUpdateField('printMargin', 'normal')}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                currentMargin === 'normal'
                  ? 'bg-white font-bold text-blue-700 shadow-2xs border border-gray-200'
                  : 'text-gray-600 hover:text-black'
              }`}
              title="Standard 9mm header and footer margins for clean A4 printing"
            >
              Normal (9mm)
            </button>
            <button
              type="button"
              onClick={() => onUpdateField('printMargin', 'relaxed')}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                currentMargin === 'relaxed'
                  ? 'bg-white font-bold text-blue-700 shadow-2xs border border-gray-200'
                  : 'text-gray-600 hover:text-black'
              }`}
              title="Extra 13mm header and footer margins for printers with wide feed margins"
            >
              Relaxed (13mm)
            </button>
            <button
              type="button"
              onClick={() => onUpdateField('printMargin', 'compact')}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                currentMargin === 'compact'
                  ? 'bg-white font-bold text-blue-700 shadow-2xs border border-gray-200'
                  : 'text-gray-600 hover:text-black'
              }`}
              title="Tight 5mm margins"
            >
              Compact (5mm)
            </button>
          </div>
        )}
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
