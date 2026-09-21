import React from 'react';
import { Truck, RefreshCw } from 'lucide-react';
import { DTDCBillData, CourierConfig } from '../types';

interface ShipmentSpecsFormProps {
  billData: DTDCBillData;
  currentConfig: CourierConfig;
  onUpdateField: (field: keyof DTDCBillData, value: any) => void;
  onGenerateNewAwb: () => void;
}

export const ShipmentSpecsForm: React.FC<ShipmentSpecsFormProps> = React.memo(({
  billData,
  currentConfig,
  onUpdateField,
  onGenerateNewAwb,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs text-xs space-y-2">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
        <span className="font-bold text-gray-900 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentConfig.shortName} Technical Specs</span>
        </span>
        <button
          type="button"
          onClick={onGenerateNewAwb}
          className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200 cursor-pointer flex items-center gap-1"
          title="Generate new valid number"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>New {currentConfig.shortName} No</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            {currentConfig.awbLabel}:
          </label>
          <input
            type="text"
            value={billData.awb}
            onChange={(e) => onUpdateField('awb', e.target.value.toUpperCase())}
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
            onChange={(e) => onUpdateField('origin', e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded px-2 py-1 font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Mode:
          </label>
          <select
            value={billData.mode}
            onChange={(e) => onUpdateField('mode', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 font-bold bg-white"
          >
            <option value="SURFACE">SURFACE</option>
            <option value="AIR">AIR</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
          Product / Service Type:
        </label>
        <input
          type="text"
          value={billData.product}
          onChange={(e) => onUpdateField('product', e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 font-semibold mb-1"
        />
        <div className="flex flex-wrap gap-1">
          {currentConfig.defaultProducts.map((p: string) => (
            <button
              key={p}
              type="button"
              onClick={() => onUpdateField('product', p)}
              className={`text-[9.5px] px-1.5 py-0.5 rounded cursor-pointer transition-colors border ${
                billData.product === p
                  ? 'bg-blue-600 text-white border-blue-700 font-bold'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Type:
          </label>
          <select
            value={billData.type}
            onChange={(e) => onUpdateField('type', e.target.value)}
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
            onChange={(e) => onUpdateField('date', e.target.value)}
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
            onChange={(e) => onUpdateField('contentSpec', e.target.value)}
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
            onChange={(e) => onUpdateField('pieces', e.target.value)}
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
            onChange={(e) => onUpdateField('declaredValue', e.target.value)}
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
            onChange={(e) => onUpdateField('actualWeight', e.target.value)}
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
            onChange={(e) => onUpdateField('chargedWeight', e.target.value)}
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
            onChange={(e) => onUpdateField('dim', e.target.value)}
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
            onChange={(e) => onUpdateField('paperworkEnclosed', e.target.value)}
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
            onChange={(e) => onUpdateField('ewaybillNumber', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 font-mono text-[11px]"
            placeholder="e.g. 123456789012"
          />
        </div>
      </div>
    </div>
  );
});
