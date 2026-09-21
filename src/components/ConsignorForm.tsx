import React from 'react';
import { DTDCBillData } from '../types';
import { FREQUENT_CONSIGNORS } from '../data/defaults';

interface ConsignorFormProps {
  billData: DTDCBillData;
  onUpdateField: (field: keyof DTDCBillData, value: any) => void;
  onApplyConsignor: (consignor: { name: string; address: string; phone: string }) => void;
}

export const ConsignorForm: React.FC<ConsignorFormProps> = React.memo(({
  billData,
  onUpdateField,
  onApplyConsignor,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Consignor Details (Sender)</span>
        </span>
        <span className="text-[10px] text-gray-500">Sender Priority Active</span>
      </div>

      <div className="mb-2.5">
        <div className="text-[10px] font-semibold text-gray-500 mb-1">
          Quick Pick Consignor:
        </div>
        <div className="flex flex-wrap gap-1">
          {FREQUENT_CONSIGNORS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onApplyConsignor(c)}
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
            onChange={(e) => onUpdateField('consignorName', e.target.value)}
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
            onChange={(e) => onUpdateField('consignorAddress', e.target.value)}
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
              onChange={(e) => onUpdateField('consignorPhone', e.target.value)}
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
              onChange={(e) => onUpdateField('senderDepot', e.target.value)}
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
              onChange={(e) => onUpdateField('consignorGstin', e.target.value)}
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
              onChange={(e) => onUpdateField('consignorEmail', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 text-[11px]"
              placeholder="Email address"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
