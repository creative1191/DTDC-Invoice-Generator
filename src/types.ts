export type CourierType = 'DTDC' | 'BLUEDART' | 'DELHIVERY';

export interface CourierConfig {
  id: CourierType;
  name: string;
  shortName: string;
  fullName: string;
  companyName: string;
  regdOfficeLine1: string;
  regdOfficeLine2: string;
  website: string;
  supportEmail: string;
  supportPhone: string;
  docTitle: string;
  defaultProducts: string[];
  awbPrefix: string;
  awbLabel: string;
  termsStatement: string;
  footerNotice: string;
  themeColor: string;
  accentColor: string;
}

export interface DTDCBillData {
  courier?: CourierType;
  awb: string;
  origin: string;
  dest: string;
  product: string; // e.g. B2C SMART EXPRESS, B2C PRIORITY
  type: string; // DOCUMENT or NON-DOCUMENT
  mode: string; // AIR or SURFACE
  date: string; // e.g. Sat Sep 19 2026

  // Consignor (Sender)
  consignorName: string;
  consignorAddress: string;
  consignorPhone: string;
  consignorGstin?: string;
  consignorEmail?: string;
  senderDepot: string;

  // Consignee (Receiver)
  customerRefNo?: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  consigneeGstin?: string;
  consigneeEmail?: string;

  // Shipment specs
  contentSpec: string; // e.g. ELECTRIC ITEMS, LAPTOP, DOCUMENTS
  paperworkEnclosed?: string;
  declaredValue: string; // e.g. 1500 or Not Applicable
  pieces: string; // e.g. 1
  actualWeight: string; // e.g. 0.23 Kgs, 2.5 Kgs, 100 Gms
  ewaybillNumber?: string;
  chargedWeight: string; // e.g. 0.23 Kgs, 2.715 Kgs, 500 Gms
  dim: string; // e.g. 10 cm X 10 cm X 10 cm

  // Booking Center / Depot
  bookingBranchName?: string;
  bookingBranchAddress?: string;
  bookingBranchPhone?: string;
  remark?: string;

  // Charges & Options
  courierCharges: number | string; // e.g. 220, 950, 140
  riskSurchargeOwner: boolean;
  riskSurchargeCarrier: boolean;

  // Printing Layout Config
  layoutMode: '3_COPIES_PORTRAIT' | 'SINGLE_LANDSCAPE';
  paperSaveMode: boolean; // When true, only Sender top copy printed, other 2 blank
}

export interface PresetLabel {
  id: string;
  name: string;
  description: string;
  data: Partial<DTDCBillData>;
}

export interface OCRMatchResult {
  awb?: string;
  origin?: string;
  dest?: string;
  product?: string;
  type?: string;
  mode?: string;
  date?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consignorName?: string;
  consignorAddress?: string;
  consignorPhone?: string;
  contentSpec?: string;
  declaredValue?: string;
  pieces?: string;
  actualWeight?: string;
  chargedWeight?: string;
  dim?: string;
  courierCharges?: number | string;
  rawText?: string;
}
