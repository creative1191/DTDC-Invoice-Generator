import React from 'react';
import { ExportableLabelItem } from '../../utils/pdfLabelExport';

interface A4LabelSheetProps {
  sheetIndex: number;
  totalSheets: number;
  // Exactly 4 slots for this sheet. Any slot beyond user count will be null/undefined.
  slots: (ExportableLabelItem | null)[];
  showCutLines: boolean;
}

export const A4LabelSheet: React.FC<A4LabelSheetProps> = ({
  sheetIndex,
  totalSheets,
  slots,
  showCutLines,
}) => {
  return (
    <div
      className="a4-sheet-container relative bg-white mx-auto shadow-md print:shadow-none print:m-0 print:border-none"
      style={{
        width: '210mm',
        minWidth: '210mm',
        height: '297mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        padding: '5mm',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Visual Sheet Header (Visible on screen preview, hidden on print) */}
      <div className="sheet-watermark no-print absolute top-1 right-2 text-[10px] font-mono text-gray-400 select-none">
        A4 Sheet {sheetIndex + 1} of {totalSheets} • 4-Up Grid (2x2)
      </div>

      {/* 2x2 Grid Layout */}
      <div
        className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[4mm]"
        style={{
          boxSizing: 'border-box',
          width: '200mm',
          height: '287mm',
        }}
      >
        {[0, 1, 2, 3].map((slotIdx) => {
          const label = slots[slotIdx];
          const globalSlotNumber = sheetIndex * 4 + slotIdx + 1;

          if (!label) {
            // Empty Unused Slot:
            // On screen: show subtle dashed indicator for operator reference.
            // On print: completely invisible / blank (no ink or border printed).
            return (
              <div
                key={`empty-slot-${slotIdx}`}
                className={`relative flex flex-col items-center justify-center rounded-sm transition-all ${
                  showCutLines
                    ? 'border border-dashed border-gray-200 print:border-none'
                    : 'border border-transparent'
                }`}
                style={{
                  width: '98mm',
                  height: '141.5mm',
                  boxSizing: 'border-box',
                }}
              >
                <div className="no-print text-center px-4 py-3 select-none">
                  <div className="w-8 h-8 rounded-full border border-gray-300 bg-gray-50 flex items-center justify-center mx-auto mb-2 text-gray-400 font-mono text-xs">
                    {globalSlotNumber}
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 block">
                    Slot {slotIdx + 1} (Unused)
                  </span>
                  <span className="text-[10px] text-gray-300 block">
                    No label printed here
                  </span>
                </div>
              </div>
            );
          }

          // Filled Slot
          const rotation = label.rotation || 0;
          const is90or270 = Math.abs(rotation % 180) === 90;

          return (
            <div
              key={label.id}
              className={`label-slot-cell relative flex items-center justify-center overflow-hidden p-[2.5mm] rounded-sm bg-white ${
                showCutLines
                  ? 'border border-dashed border-gray-300 print:border-gray-300'
                  : 'border border-transparent'
              }`}
              style={{
                width: '98mm',
                height: '141.5mm',
                boxSizing: 'border-box',
              }}
            >
              {/* Screen-only Slot Badge */}
              <div className="no-print absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xs z-10 select-none">
                #{globalSlotNumber}
              </div>

              {/* Label Content: Scaled with preserved aspect ratio, centered, zero distortion */}
              <div className="w-full h-full flex items-center justify-center p-1">
                <img
                  src={label.dataUrl}
                  alt={label.title || `Shipping Label #${globalSlotNumber}`}
                  className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                  style={{
                    transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    // If rotated 90 or 270, adjust sizing so it fits cleanly inside slot
                    maxWidth: is90or270 ? '135mm' : '94mm',
                    maxHeight: is90or270 ? '94mm' : '135mm',
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Screen Cut guide corner marks */}
              {showCutLines && (
                <div className="no-print absolute bottom-1 right-1 text-[8px] font-mono text-gray-300 select-none">
                  Cut guide
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
