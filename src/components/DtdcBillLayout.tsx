import React from 'react';
import { DTDCBillData } from '../types';
import { DtdcLogo } from './DtdcLogo';
import { BarcodeRenderer } from './BarcodeRenderer';

interface DtdcBillLayoutProps {
  data: DTDCBillData;
  copyTitle?: string;
  isPodCopy?: boolean;
  isBlank?: boolean;
  isLandscapeFull?: boolean;
  customLogoUrl?: string | null;
}

export const formatAmount = (val: number | string | undefined): string => {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export const DtdcBillLayout: React.FC<DtdcBillLayoutProps> = ({
  data,
  copyTitle = "Sender's Copy",
  isPodCopy = false,
  isBlank = false,
  isLandscapeFull = false,
  customLogoUrl,
}) => {
  // If in Paper Save Mode, render COMPLETELY BLANK space (no text, no borders, no watermark)
  if (isBlank) {
    return <div className="w-full h-[88mm] bg-transparent" />;
  }

  const heightClass = isLandscapeFull ? 'min-h-[185mm]' : 'min-h-[88mm] max-h-[91mm]';

  return (
    <div
      className={`w-full ${heightClass} border-[1.5px] border-black bg-white text-black flex flex-col justify-between box-border overflow-hidden select-text`}
      style={{ fontFamily: 'Segoe UI, Arial, Helvetica, sans-serif' }}
    >
      {/* ================= 1. HEADER ROW ================= */}
      <div className="grid grid-cols-12 border-b-[1.5px] border-black items-stretch">
        {/* Top Left: Logo & Registered Office Address (~42% width) */}
        <div className="col-span-5 flex items-center gap-2 p-1.5 border-r-[1.5px] border-black">
          <DtdcLogo customLogoUrl={customLogoUrl} className={isLandscapeFull ? 'h-10' : 'h-7'} />
          <div className="leading-tight text-black">
            <div className="font-bold text-[10px] tracking-tight">DTDC Express Limited</div>
            <div className="text-[8px] text-gray-800">Regd. Office No. 3, Victoria Road</div>
            <div className="text-[8px] text-gray-800">Bengaluru - 560047</div>
          </div>
        </div>

        {/* Top Right: Origin / Dest / Product / Type / Date (~58% width) */}
        <div className="col-span-7 grid grid-cols-2">
          {/* Origin & Product column */}
          <div className="flex flex-col justify-between border-r-[1.5px] border-black">
            <div className="border-b-[1.5px] border-black text-center py-0.5 text-[9px]">
              Origin: <span className="font-bold uppercase">{data.origin || 'SATNA'}</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-1 font-bold text-[10px] tracking-wide text-center uppercase">
              PRODUCT: {data.product || 'B2C SMART EXPRESS'}
            </div>
          </div>

          {/* Dest, Type & Date column */}
          <div className="flex flex-col justify-between text-center">
            <div className="border-b-[1.5px] border-black py-0.5 text-[9px]">
              Dest: <span className="font-bold uppercase">{data.dest || 'MEHSANA'}</span>
            </div>
            <div className="border-b-[1.5px] border-black py-0.5 text-[9px]">
              Type: <span className="font-bold uppercase">{data.type || 'NON-DOCUMENT'}</span>
            </div>
            <div className="py-0.5 text-[8.5px] text-gray-800">
              Date: <span className="font-normal">{data.date || 'Sat Sep 19 2026'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. CONSIGNOR & CONSIGNEE DETAILS ================= */}
      <div className="grid grid-cols-2 border-b-[1.5px] border-black items-stretch">
        {/* Consignor (Left) */}
        <div className="p-1.5 border-r-[1.5px] border-black text-[8.5px] leading-[1.3] text-black">
          <div>
            Consignor's Name: <span className="font-bold">{data.consignorName || 'Dharmendra kumar kushwaha'}</span>
          </div>
          <div className="mt-0.5">
            Consignor's Address: <span className="font-bold">{data.consignorAddress || 'Ghatehkala post rahikwara nagod, distt satna madhyapradesh 485446'}</span>
          </div>
          <div className="mt-0.5">
            GSTIN No.: <span>{data.consignorGstin || ''}</span>
          </div>
          <div className="mt-0.5 flex gap-4">
            <span>Phone: <span className="font-bold font-mono">{data.consignorPhone || '0000000000'}</span></span>
            <span>Email : <span>{data.consignorEmail || ''}</span></span>
          </div>
        </div>

        {/* Consignee (Right) */}
        <div className="p-1.5 flex flex-col justify-between text-[8.5px] leading-[1.3] text-black">
          <div>
            <div>
              Customer Ref No: <span>{data.customerRefNo || ''}</span>
            </div>
            <div className="mt-0.5">
              Consignee's Name: <span className="font-bold">{data.consigneeName || 'Mantra softech india pvt ltd'}</span>
            </div>
            <div className="mt-0.5">
              Consignee's Address: <span className="font-bold">{data.consigneeAddress || 'LS no 2376/1A, 13501, near rainbow company jhulasan road, village rajpur, taluka kadi, mahesana, MEHSANA, GUJARAT, 384440'}</span>
            </div>
            <div className="mt-0.5">
              GSTIN No.: <span>{data.consigneeGstin || ''}</span>
            </div>
            <div className="mt-0.5 flex gap-4">
              <span>Phone: <span className="font-bold font-mono">{data.consigneePhone || '0000000000'}</span></span>
              <span>Email : <span>{data.consigneeEmail || ''}</span></span>
            </div>
          </div>

          {/* Courier Charges Box (User rule: amount by default decimal ke baad double zero rhega) */}
          <div className="mt-1">
            <div className="border-[1.5px] border-black px-2.5 py-0.5 inline-block font-bold text-[10.5px]">
              Courier Charges: ₹ {formatAmount(data.courierCharges)}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. TECHNICAL SPECS, BARCODE & SIGNATURES ================= */}
      <div className="grid grid-cols-12 border-b-[1.5px] border-black items-stretch flex-1">
        {/* Column 1: Content Spec, Paperwork & Declaration (~33% width) */}
        <div className="col-span-4 border-r-[1.5px] border-black flex flex-col justify-between">
          <div className="p-1 border-b-[1.5px] border-black text-[8.5px]">
            Content Specification : <span className="font-bold">{data.contentSpec || 'ELECTRIC ITEMS'}</span>
          </div>
          <div className="p-1 border-b-[1.5px] border-black text-[8px]">
            Paperwork Enclosed : <span>{data.paperworkEnclosed || ''}</span>
          </div>

          <div className="p-1 text-[7px] leading-tight flex-1 flex flex-col justify-between">
            <div>
              I/We declare that this consignment does not contain personal mail, cash, jewellery, contraband, illegal drugs, any prohibited items and commodities which can cause safety hazards while transporting
            </div>

            <div className="text-center my-1">
              <div className="font-bold text-[8.5px]">
                {isPodCopy ? "Receiver's Signature & Stamp" : "Sender's Signature & Seal"}
              </div>
              <div className="text-[6.5px] text-gray-700 mt-0.5">
                I have read and understood terms & conditions of carriage mentioned on website www.dtdc.in, and I agree to the same.
              </div>
            </div>
          </div>

          <div className="border-t-[1.5px] border-black px-1 py-0.5 text-[6.5px] text-center text-gray-800">
            https://www.dtdc.in | customersupport@dtdc.com | +91-9606911811
          </div>
        </div>

        {/* Column 2: Weights, Pieces, Dimensions & Depot Address (~27% width) */}
        <div className="col-span-3 border-r-[1.5px] border-black flex flex-col text-[8px]">
          <div className="p-0.5 px-1 border-b-[1.5px] border-black">
            Declared Value: <span className="font-bold">{data.declaredValue || '1500'}</span>
          </div>
          <div className="p-0.5 px-1 border-b-[1.5px] border-black">
            No Of Pieces: <span className="font-bold">{data.pieces || '1'}</span>
          </div>
          <div className="p-0.5 px-1 border-b-[1.5px] border-black">
            Actual Weight: <span className="font-bold">{data.actualWeight || '0.23 Kgs'}</span>
          </div>
          <div className="p-0.5 px-1 border-b-[1.5px] border-black">
            Ewaybill Number: <span className="font-mono">{data.ewaybillNumber || ''}</span>
          </div>
          <div className="p-0.5 px-1 border-b-[1.5px] border-black">
            Dim: <span className="font-bold">{data.dim || '10 cm X 10 cm X 10 cm'}</span>
          </div>
          <div className="p-0.5 px-1 border-b-[1.5px] border-black">
            Charged weight: <span className="font-bold">{data.chargedWeight || '0.23 Kgs'}</span>
          </div>

          {/* Booking Center / Branch details */}
          <div className="p-1 text-[7px] leading-tight flex-1">
            <div>
              Name : <span className="font-bold uppercase">{data.bookingBranchName || 'MAA SHARDA ENTERPRISES'}</span>
            </div>
            <div className="mt-0.5">
              Address: <span className="font-bold uppercase">{data.bookingBranchAddress || 'NEAR REST HOUSE, NAGOD, SATNA, MADHYA PRADESH 485446'}</span>
            </div>
            <div className="mt-0.5">
              Phone : <span className="font-bold font-mono">{data.bookingBranchPhone || '8982091190'}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Mode, Barcode, Risk Surcharge & Remark (~40% width) */}
        <div className="col-span-5 flex flex-col justify-between">
          {/* Barcode Block */}
          <div className="p-1 flex flex-col items-center justify-center text-center">
            <div className="text-[10px]">
              Mode: <span className="font-bold">{data.mode || 'SURFACE'}</span>
            </div>
            <div className="my-0.5 w-full flex justify-center">
              <BarcodeRenderer
                value={data.awb || '7D134850071'}
                width={isLandscapeFull ? 2 : 1.3}
                height={isLandscapeFull ? 38 : 25}
                className="w-full max-w-[200px]"
              />
            </div>
            <div className="text-[9.5px]">
              AWB No: <span className="font-bold font-mono">{data.awb || '7D134850071'}</span>
            </div>
          </div>

          {/* Risk Surcharge Grid */}
          <div className="border-t-[1.5px] border-black">
            <div className="grid grid-cols-12 items-stretch">
              <div className="col-span-7 border-r-[1.5px] border-black flex items-center justify-center p-1">
                <span className="font-bold text-[11px]">Risk Surcharge</span>
              </div>
              <div className="col-span-5 flex flex-col justify-between">
                <div className="border-b-[1.5px] border-black flex items-center justify-between px-2 py-0.5 text-[8.5px]">
                  <span>Owner</span>
                  <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[9px] leading-none">
                    {data.riskSurchargeOwner ? '✓' : ''}
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-0.5 text-[8.5px]">
                  <span>Carrier</span>
                  <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[9px] leading-none">
                    {data.riskSurchargeCarrier ? '✓' : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-[1.5px] border-black px-1.5 py-0.5 text-[8px]">
              Remark : <span>{data.remark || ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. FOOTER BAR ================= */}
      <div className="px-1.5 py-0.5 flex items-center justify-between text-[7.5px] font-bold tracking-tight">
        <span>THIS DOCUMENT IS NOT A TAX INVOICE. WEIGHT CAPTURED BY DTDC WILL BE USED FOR INVOICE GENERATION.</span>
        <span>{copyTitle}</span>
      </div>
    </div>
  );
};
