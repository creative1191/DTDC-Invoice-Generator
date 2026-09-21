import React, { useCallback } from 'react';
import { DTDCBillData } from '../types';

interface CourierChargesCardProps {
  charges: string | number;
  onUpdateField: (field: keyof DTDCBillData, value: any) => void;
}

const PRESET_RATES = ['140.00', '220.00', '950.00'] as const;

export const CourierChargesCard: React.FC<CourierChargesCardProps> = React.memo(({
  charges,
  onUpdateField,
}) => {
  const handleBlur = useCallback(() => {
    const num = parseFloat(String(charges).replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      onUpdateField('courierCharges', num.toFixed(2));
    } else {
      onUpdateField('courierCharges', '0.00');
    }
  }, [charges, onUpdateField]);

  return (
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
            value={charges}
            onChange={(e) => onUpdateField('courierCharges', e.target.value)}
            onBlur={handleBlur}
            className="w-full font-black text-lg font-mono text-black focus:outline-none"
            placeholder="220.00"
          />
        </div>
        <div className="flex gap-1">
          {PRESET_RATES.map((rate) => {
            const isSelected = String(charges) === rate || Number(charges) === Number(rate);
            return (
              <button
                key={rate}
                type="button"
                onClick={() => onUpdateField('courierCharges', rate)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded cursor-pointer transition-colors border ${
                  isSelected
                    ? 'bg-yellow-400 border-yellow-600 text-black'
                    : 'bg-white hover:bg-yellow-100 text-gray-800 border-gray-300'
                }`}
              >
                ₹{rate}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
