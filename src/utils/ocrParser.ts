import { OCRMatchResult, CourierType } from '../types';

/**
 * Detects which courier (DTDC, BLUEDART, or DELHIVERY) a raw text / document belongs to.
 */
export function detectCourierFromText(rawText: string): CourierType | null {
  const upper = rawText.toUpperCase();
  if (upper.includes('BLUE DART') || upper.includes('BLUEDART') || upper.includes('AIR WAYBILL') || upper.includes('WBN')) {
    return 'BLUEDART';
  }
  if (upper.includes('DELHIVERY') || upper.includes('DELHIVERY EXPRESS') || upper.includes('EXPRESS PARCEL')) {
    return 'DELHIVERY';
  }
  if (upper.includes('DTDC') || upper.includes('DOTZOT') || upper.includes('7D') || upper.includes('7X')) {
    return 'DTDC';
  }
  return null;
}

/**
 * Parses OCR extracted text across DTDC, Blue Dart, and Delhivery courier formats.
 * Handles receipts, invoices, shipping manifests, and label snippets.
 */
export function parseCourierOcrText(rawText: string, preferredCourier?: CourierType): OCRMatchResult {
  const result: OCRMatchResult = { rawText };

  if (!rawText || rawText.trim().length === 0) {
    return result;
  }

  // Detect courier or use preferred
  const detected = detectCourierFromText(rawText) || preferredCourier || 'DTDC';
  result.detectedCourier = detected;

  // ================= 1. AWB NUMBER EXTRACTION =================
  if (detected === 'BLUEDART') {
    // Blue Dart: 8-11 digits (e.g. 7839420194, 84930192834, 351249821)
    const bdAwbMatch = rawText.match(/(?:Waybill|Way\s*Bill|AWB|Air\s*Waybill|WBN|Tracking\s*(?:No|#)|Wb\s*No)\s*[:#\.\-]?\s*([0-9]{8,12})/i);
    if (bdAwbMatch && bdAwbMatch[1]) {
      result.awb = bdAwbMatch[1].trim();
    } else {
      // Look for standalone 9 to 11 digit numbers
      const bdFallback = rawText.match(/\b([0-9]{9,11})\b/);
      if (bdFallback && bdFallback[1]) {
        result.awb = bdFallback[1].trim();
      }
    }
  } else if (detected === 'DELHIVERY') {
    // Delhivery: 12-15 digits (e.g. 1412345678901, 1234567890123)
    const delAwbMatch = rawText.match(/(?:AWB|Waybill|LR\s*No|Tracking\s*(?:No|#)|Order\s*ID)\s*[:#\.\-]?\s*([0-9]{12,15})/i);
    if (delAwbMatch && delAwbMatch[1]) {
      result.awb = delAwbMatch[1].trim();
    } else {
      // Look for standalone 12 to 14 digit numbers
      const delFallback = rawText.match(/\b([0-9]{12,14})\b/);
      if (delFallback && delFallback[1]) {
        result.awb = delFallback[1].trim();
      }
    }
  } else {
    // DTDC: Starts with 7D, 7X, or 7 followed by digits/letters
    const awbPrimary = rawText.match(/AWB\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,})/i);
    if (awbPrimary && awbPrimary[1]) {
      result.awb = awbPrimary[1].trim().toUpperCase();
    } else {
      const awbSecondary = rawText.match(/\b(7[A-Z0-9]{9,12})\b/);
      if (awbSecondary && awbSecondary[1]) {
        result.awb = awbSecondary[1].trim().toUpperCase();
      }
    }
  }

  // ================= 2. ORIGIN & DESTINATION =================
  const originMatch = rawText.match(/(?:Origin|From\s*Station|From\s*City|Shipped\s*From)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|Dest|To|,|$)/i);
  if (originMatch && originMatch[1]) {
    const cleanOrigin = originMatch[1].trim().toUpperCase();
    if (cleanOrigin.length >= 2 && cleanOrigin.length <= 25) {
      result.origin = cleanOrigin;
    }
  }

  const destMatch = rawText.match(/(?:Dest(?:ination)?|To\s*Station|To\s*City|Delivery\s*City|Destn)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|Product|Type|Weight|Date|,|$)/i);
  if (destMatch && destMatch[1]) {
    const cleanDest = destMatch[1].trim().toUpperCase();
    if (cleanDest.length >= 2 && cleanDest.length <= 25) {
      result.dest = cleanDest;
    }
  }

  // ================= 3. CONSIGNEE (RECEIVER) =================
  // Consignee Name
  const consigneeNameMatch = rawText.match(
    /(?:Consignee(?:\s*Name)?|Ship\s*To|Deliver(?:y)?\s*To|Receiver|Customer(?:\s*Name)?|To)\s*[:\-]?\s*([A-Za-z0-9\s\.\-&]{3,45}?)(?:\n|Address|Phone|Contact|Ph|Mob|Tel|Pin|$)/i
  );
  if (consigneeNameMatch && consigneeNameMatch[1]) {
    const name = consigneeNameMatch[1].trim();
    if (!name.match(/^(address|phone|tel|dtdc|blue dart|delhivery)$/i)) {
      result.consigneeName = name;
    }
  }

  // Consignee Address
  const consigneeAddrMatch = rawText.match(
    /(?:Consignee[\s\S]*?Address|Delivery\s*Address|Address|Ship\s*To[\s\S]*?Address)\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+){0,2})/i
  );
  if (consigneeAddrMatch && consigneeAddrMatch[1]) {
    result.consigneeAddress = consigneeAddrMatch[1].replace(/\r?\n/g, ', ').trim();
  }

  // Consignee Phone
  const phoneMatch = rawText.match(
    /(?:(?:Consignee|Receiver|Customer|Delivery)[\s\S]*?(?:Phone|Contact|Mobile|Ph|Tel|Mob)\s*[:\-]?\s*|(?:\+91[\-\s]?)?)([6-9]\d{9})\b/i
  );
  if (phoneMatch && phoneMatch[1]) {
    result.consigneePhone = phoneMatch[1].trim();
  } else {
    const generalPhone = rawText.match(/(?:Phone|Contact|Mobile|Ph|Tel|Mob)\s*[:\-]?\s*(\+?\d[\d\s\-]{8,13}\d)/i);
    if (generalPhone && generalPhone[1]) {
      result.consigneePhone = generalPhone[1].replace(/[\s\-]/g, '').trim();
    }
  }

  // If destination not found yet, check for 6-digit PIN code and city in address
  if (!result.dest && result.consigneeAddress) {
    const pinMatch = result.consigneeAddress.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      // Find word before PIN
      const words = result.consigneeAddress.split(/[\s,]+/);
      const pinIndex = words.findIndex(w => w.includes(pinMatch[1]));
      if (pinIndex > 0 && words[pinIndex - 1].length > 2) {
        result.dest = words[pinIndex - 1].toUpperCase();
      }
    }
  }

  // ================= 4. CONSIGNOR (SENDER) =================
  const consignorNameMatch = rawText.match(
    /(?:Consignor(?:\s*Name)?|Shipper(?:\s*Name)?|Sender(?:\s*Name)?|Return\s*To|From(?:\s*Name)?|Vendor|Merchant)\s*[:\-]?\s*([A-Za-z0-9\s\.\-&]{3,45}?)(?:\n|Address|Phone|Contact|Ph|Mob|Tel|GST|$)/i
  );
  if (consignorNameMatch && consignorNameMatch[1]) {
    const sName = consignorNameMatch[1].trim();
    if (!sName.match(/^(address|phone|tel|dtdc|blue dart|delhivery)$/i)) {
      result.consignorName = sName;
    }
  }

  const consignorAddrMatch = rawText.match(
    /(?:Consignor[\s\S]*?Address|Shipper\s*Address|Sender\s*Address|Return\s*Address)\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+){0,2})/i
  );
  if (consignorAddrMatch && consignorAddrMatch[1]) {
    result.consignorAddress = consignorAddrMatch[1].replace(/\r?\n/g, ', ').trim();
  }

  const consignorGstinMatch = rawText.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
  if (consignorGstinMatch && consignorGstinMatch[1]) {
    result.consignorGstin = consignorGstinMatch[1].trim();
  }

  // ================= 5. PRODUCT, TYPE & MODE =================
  if (detected === 'BLUEDART') {
    if (rawText.match(/APEX|AIR/i)) {
      result.product = 'APEX';
      result.mode = 'AIR';
    } else if (rawText.match(/SURFACE/i)) {
      result.product = 'SURFACE';
      result.mode = 'SURFACE';
    } else {
      result.product = 'DOMESTIC PRIORITY';
      result.mode = 'AIR';
    }
    result.type = rawText.match(/NON[\-\s]?DOC/i) ? 'NON-DOCUMENT' : 'DOCUMENT';
  } else if (detected === 'DELHIVERY') {
    if (rawText.match(/SURFACE|HEAVY/i)) {
      result.product = 'Heavy Surface';
      result.mode = 'SURFACE';
    } else {
      result.product = 'Express Parcel';
      result.mode = 'AIR';
    }
    result.type = 'NON-DOCUMENT';
  } else {
    // DTDC
    const productMatch = rawText.match(/PRODUCT\s*:\s*([A-Z0-9\s\-]+?)(?:\n|Type|Date|$)/i);
    if (productMatch && productMatch[1]) {
      result.product = productMatch[1].trim();
    }
    const typeMatch = rawText.match(/Type\s*:\s*([A-Za-z\-]+)/i);
    if (typeMatch && typeMatch[1]) {
      result.type = typeMatch[1].trim().toUpperCase().includes('NON') ? 'NON-DOCUMENT' : 'DOCUMENT';
    }
    const modeMatch = rawText.match(/Mode\s*:\s*([A-Za-z]+)/i);
    if (modeMatch && modeMatch[1]) {
      result.mode = modeMatch[1].trim().toUpperCase();
    }
  }

  // ================= 6. WEIGHT & PIECES =================
  const actualWtMatch = rawText.match(/(?:Actual\s*Weight|Weight|Gross\s*Wt|Wt)\s*[:\-]?\s*([0-9\.]+\s*(?:Gms|Kgs|kg|gm|KG))/i);
  if (actualWtMatch && actualWtMatch[1]) {
    result.actualWeight = actualWtMatch[1].trim();
  }

  const chargedWtMatch = rawText.match(/(?:Charged\s*Weight|Chargeable\s*Wt|Vol\s*Weight)\s*[:\-]?\s*([0-9\.]+\s*(?:Gms|Kgs|kg|gm|KG))/i);
  if (chargedWtMatch && chargedWtMatch[1]) {
    result.chargedWeight = chargedWtMatch[1].trim();
  }

  const piecesMatch = rawText.match(/(?:No\s*Of\s*Pieces|Pieces|Pcs|Quantity|Qty)\s*[:\-]?\s*([0-9]+)/i);
  if (piecesMatch && piecesMatch[1]) {
    result.pieces = piecesMatch[1].trim();
  }

  // ================= 7. CONTENT SPECIFICATION & VALUE =================
  const contentMatch = rawText.match(/(?:Content\s*(?:Specification)?|Description|Item|Goods\s*Description|Commodity)\s*[:\-]?\s*([A-Za-z0-9\s,\-]+?)(?:\n|Declared|Value|Weight|Pieces|Date|Rs|₹|$)/i);
  if (contentMatch && contentMatch[1]) {
    const cleanContent = contentMatch[1].trim().toUpperCase();
    if (cleanContent.length >= 2 && cleanContent.length <= 40) {
      result.contentSpec = cleanContent;
    }
  }

  const declaredMatch = rawText.match(/(?:Declared\s*Value|Value|Invoice\s*Value|Amount|COD\s*Amount)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (declaredMatch && declaredMatch[1]) {
    result.declaredValue = declaredMatch[1].trim();
  }

  // ================= 8. COURIER CHARGES =================
  const chargesMatch = rawText.match(/(?:Courier\s*Charges|Freight|Total\s*Amount|Charges|Rate|Booking\s*Charge)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (chargesMatch && chargesMatch[1]) {
    result.courierCharges = parseFloat(chargesMatch[1]);
  }

  // ================= 9. DATE =================
  const dateMatch = rawText.match(/(?:Date\s*[:\-]?\s*)?([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4})/i);
  if (dateMatch && dateMatch[1]) {
    result.date = dateMatch[1].trim();
  } else {
    const altDate = rawText.match(/\b(\d{1,2}[\/\-][A-Za-z0-9]{3}[\/\-]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    if (altDate) {
      result.date = altDate[1];
    }
  }

  return result;
}

// Backward compatibility alias for existing code
export const parseDtdcOcrText = parseCourierOcrText;
