import React from 'react';
import { Package } from 'lucide-react';
import { PresetLabel, DTDCBillData, CourierConfig } from '../types';

interface QuickPresetsBarProps {
  currentConfig: CourierConfig;
  currentPresets: PresetLabel[];
  activePresetId: string;
  onApplyPreset: (preset: PresetLabel) => void;
  layoutMode: DTDCBillData['layoutMode'];
  paperSaveMode: boolean;
  onUpdateField: (field: keyof DTDCBillData, value: any) => void;
}

export const QuickPresetsBar: React.FC<QuickPresetsBarProps> = React.memo(({
  currentConfig,
  currentPresets,
  activePresetId,
  onApplyPreset,
  layoutMode,
  paperSaveMode,
  onUpdateField,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-2xs mb-3 flex flex-wrap items-center justify-between gap-2 no-print">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentConfig.shortName} Presets:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {currentPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
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

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 p-0.5 rounded-md text-xs font-semibold">
          <button
            type="button"
            onClick={() => onUpdateField('layoutMode', '3_COPIES_PORTRAIT')}
            className={`px-2.5 py-1 rounded cursor-pointer ${
              layoutMode === '3_COPIES_PORTRAIT'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            3 Copies Portrait (A4)
          </button>
          <button
            type="button"
            onClick={() => onUpdateField('layoutMode', 'SINGLE_LANDSCAPE')}
            className={`px-2.5 py-1 rounded cursor-pointer ${
              layoutMode === 'SINGLE_LANDSCAPE'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Single Landscape (A4)
          </button>
        </div>

        {layoutMode === '3_COPIES_PORTRAIT' && (
          <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={paperSaveMode}
              onChange={(e) => onUpdateField('paperSaveMode', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Paper Save Mode</span>
          </label>
        )}
      </div>
    </div>
  );
});
