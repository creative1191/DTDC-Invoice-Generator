import React from 'react';
import { DTDCBillData } from '../types';

interface ConsigneeFormProps {
  billData: DTDCBillData;
  onUpdateField: (field: keyof DTDCBillData, value: any) => void;
}

export const ConsigneeForm: React.FC<ConsigneeFormProps> = React.memo(({
  billData,
  onUpdateField,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>Consignee Details (Recipient)</span>
        </span>
        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
          DEST: {billData.dest || 'MEHSANA'}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
            Consignee Name:
          </label>
          <input
            type="text"
            value={billData.consigneeName}
            onChange={(e) => onUpdateField('consigneeName', e.target.value)}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-bold text-gray-900 focus:outline-none focus:border-blue-600"
            placeholder="e.g. Mantra softech india pvt ltd"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
            Consignee Address:
          </label>
          <textarea
            rows={2}
            value={billData.consigneeAddress}
            onChange={(e) => onUpdateField('consigneeAddress', e.target.value)}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-600 resize-none"
            placeholder="e.g. LS no 2376/1A, MEHSANA, GUJARAT, 384440"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
              Recipient Contact:
            </label>
            <input
              type="text"
              value={billData.consigneePhone}
              onChange={(e) => onUpdateField('consigneePhone', e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono text-gray-900 focus:outline-none focus:border-blue-600"
              placeholder="e.g. 0000000000"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
              Destination City:
            </label>
            <input
              type="text"
              value={billData.dest}
              onChange={(e) => onUpdateField('dest', e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-bold text-blue-900 uppercase focus:outline-none focus:border-blue-600"
              placeholder="e.g. MEHSANA, KOTA, TRICHUR"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
              Customer Ref No:
            </label>
            <input
              type="text"
              value={billData.customerRefNo || ''}
              onChange={(e) => onUpdateField('customerRefNo', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 font-mono text-[11px]"
              placeholder="Ref #"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
              GSTIN No.:
            </label>
            <input
              type="text"
              value={billData.consigneeGstin || ''}
              onChange={(e) => onUpdateField('consigneeGstin', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 font-mono text-[11px]"
              placeholder="GSTIN No"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
              Email:
            </label>
            <input
              type="email"
              value={billData.consigneeEmail || ''}
              onChange={(e) => onUpdateField('consigneeEmail', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-gray-800 text-[11px]"
              placeholder="Email"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
