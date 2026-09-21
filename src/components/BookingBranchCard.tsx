import React from 'react';
import { DTDCBillData } from '../types';

interface BookingBranchCardProps {
  billData: DTDCBillData;
  onUpdateField: (field: keyof DTDCBillData, value: any) => void;
}

export const BookingBranchCard: React.FC<BookingBranchCardProps> = React.memo(({
  billData,
  onUpdateField,
}) => {
  return (
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
            onChange={(e) => onUpdateField('bookingBranchName', e.target.value)}
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
            onChange={(e) => onUpdateField('bookingBranchPhone', e.target.value)}
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
          onChange={(e) => onUpdateField('bookingBranchAddress', e.target.value)}
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
                onChange={(e) => onUpdateField('riskSurchargeOwner', e.target.checked)}
                className="w-3.5 h-3.5"
              />
              <span>Owner [✓]</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={billData.riskSurchargeCarrier}
                onChange={(e) => onUpdateField('riskSurchargeCarrier', e.target.checked)}
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
            onChange={(e) => onUpdateField('remark', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-[11px]"
            placeholder="Optional remark"
          />
        </div>
      </div>
    </div>
  );
});
