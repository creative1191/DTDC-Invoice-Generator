import React from 'react';
import { DTDCBillData } from '../types';
import { DtdcBillLayout } from './DtdcBillLayout';

interface PrintSheetProps {
  data: DTDCBillData;
  customLogoUrl?: string | null;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({
  data,
  customLogoUrl,
  sheetRef,
}) => {
  const marginMode = data.printMargin || 'normal';
  const marginClass =
    marginMode === 'relaxed'
      ? 'margin-relaxed p-4'
      : marginMode === 'compact'
      ? 'margin-compact p-2'
      : 'margin-normal p-3';

  if (data.layoutMode === 'SINGLE_LANDSCAPE') {
    return (
      <div
        ref={sheetRef}
        id="dtdc-print-area"
        className={`print-container-landscape ${marginClass} bg-white w-full max-w-[297mm] print:min-h-0 mx-auto shadow-md print:shadow-none`}
      >
        <DtdcBillLayout
          data={data}
          copyTitle="Sender's Copy"
          isLandscapeFull={true}
          customLogoUrl={customLogoUrl}
        />
      </div>
    );
  }

  // 3 COPIES PORTRAIT (Standard A4 Portrait 210mm x 297mm)
  // Stacked vertically:
  // 1. Sender's Copy (Top)
  // In normal mode: Copy 2 is Consignee/Transit Copy, Copy 3 is POD Copy.
  // In paperSaveMode: Only Sender's Copy is rendered, the bottom 2 copies are COMPLETELY BLANK (no text, no borders).
  return (
    <div
      ref={sheetRef}
      id="dtdc-print-area"
      className={`print-container ${marginClass} bg-white w-full max-w-[210mm] min-h-[285mm] print:min-h-0 mx-auto shadow-md print:shadow-none flex flex-col justify-between`}
    >
      {/* COPY 1: Always Sender's Copy */}
      <DtdcBillLayout
        data={data}
        copyTitle="Sender's Copy"
        isBlank={false}
        isPodCopy={false}
        customLogoUrl={customLogoUrl}
      />

      {/* Dotted cut line between copies (Only when NOT in paper save mode) */}
      {!data.paperSaveMode ? (
        <div className="border-t border-dashed border-gray-400 relative my-0.5 text-center no-print">
          <span className="bg-white px-2 text-[9px] text-gray-500 font-mono -top-2.5 relative">
            ✂ --- CUT HERE (Copy 1 / Copy 2) --- ✂
          </span>
        </div>
      ) : (
        <div className="h-1" />
      )}

      {/* COPY 2: Sender Copy / Transit Copy (or completely Blank in Paper Save Mode) */}
      <DtdcBillLayout
        data={data}
        copyTitle="Consignee's Copy"
        isBlank={data.paperSaveMode}
        isPodCopy={false}
        customLogoUrl={customLogoUrl}
      />

      {/* Dotted cut line between copies (Only when NOT in paper save mode) */}
      {!data.paperSaveMode ? (
        <div className="border-t border-dashed border-gray-400 relative my-0.5 text-center no-print">
          <span className="bg-white px-2 text-[9px] text-gray-500 font-mono -top-2.5 relative">
            ✂ --- CUT HERE (Copy 2 / POD Copy) --- ✂
          </span>
        </div>
      ) : (
        <div className="h-1" />
      )}

      {/* COPY 3: POD Copy (or completely Blank in Paper Save Mode) */}
      <DtdcBillLayout
        data={data}
        copyTitle="P.O.D. Copy"
        isBlank={data.paperSaveMode}
        isPodCopy={true}
        customLogoUrl={customLogoUrl}
      />
    </div>
  );
};
