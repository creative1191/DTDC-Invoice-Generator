import { OCRMatchResult, CourierType } from '../types';

/**
 * Removes duplicate address blocks, billing address remnants, and labels.
 * Ensures the shipping address is clean and never repeated.
 */
export function cleanAddressString(rawAddress?: string, nameToStrip?: string): string {
  if (!rawAddress) return '';

  let cleaned = rawAddress
    // Cut off anything starting from BILLING ADDRESS, BILL TO, ORDER DETAILS, or ITEM DESCRIPTION
    .replace(/(?:BILLING\s*ADDRESS|BILL\s*TO\s*ADDRESS|BILL\s*TO|ORDER\s*DETAILS|SALES\s*NUMBER|ITEM\s*DESCRIPTION|PAYMENT\s*TYPE|POWERED\s*BY)[\s\S]*/i, '')
    // Remove leading labels
    .replace(/^(?:SHIPPING\s*ADDRESS|SHIP\s*TO\s*ADDRESS|SHIP\s*TO|DELIVERY\s*ADDRESS|ADDRESS)\s*[:\-]?\s*/i, '')
    .trim();

  // If the consignee name is at the beginning of the address, strip it so it doesn't repeat
  if (nameToStrip && nameToStrip.trim().length > 2) {
    const escaped = nameToStrip.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^${escaped}\\s*[,\\-\\n\\s]*`, 'i'), '');
  }

  // Split into comma, semicolon, or newline segments
  const segments = cleaned
    .split(/[,;\n\r]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueSegments: string[] = [];

  for (const seg of segments) {
    const norm = seg.toLowerCase().replace(/\s+/g, ' ');

    // Filter out label words
    if (
      norm === 'shipping address' ||
      norm === 'billing address' ||
      norm === 'delivery address' ||
      norm === 'address' ||
      norm === 'order details' ||
      norm === 'sales number' ||
      norm === 'item description' ||
      norm.startsWith('awb number') ||
      norm.startsWith('sale date') ||
      norm.startsWith('payment type') ||
      norm.startsWith('powered by')
    ) {
      continue;
    }

    // Skip if segment equals the consignee name
    if (nameToStrip && norm === nameToStrip.trim().toLowerCase()) {
      continue;
    }

    // Check if we've already included this segment or very similar phrase
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueSegments.push(seg);
    }
  }

  // If the result still has duplicate halves (e.g. "Ambala, Haryana - 133006, Ambala, Haryana - 133006")
  let joined = uniqueSegments.join(', ');
  const halfLen = Math.floor(joined.length / 2);
  if (halfLen > 15) {
    const firstHalf = joined.slice(0, halfLen).trim().replace(/,$/, '');
    const secondHalf = joined.slice(halfLen).trim().replace(/^,/, '').trim();
    if (secondHalf.toLowerCase().includes(firstHalf.toLowerCase())) {
      joined = secondHalf;
    }
  }

  return joined;
}

/**
 * Detects which courier (DTDC, BLUEDART, or DELHIVERY) a raw text / document belongs to.
 */
export function detectCourierFromText(rawText: string): CourierType | null {
  const upper = rawText.toUpperCase();
  if (upper.includes('BLUE DART') || upper.includes('BLUEDART') || upper.includes('AIR WAYBILL') || upper.includes('WBN')) {
    return 'BLUEDART';
  }
  if (upper.includes('DELHIVERY') || upper.includes('POWERED BY DELHIVERY') || upper.includes('DELHIVERY EXPRESS') || upper.includes('EXPRESS PARCEL')) {
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
    const bdAwbMatch = rawText.match(/(?:Waybill|Way\s*Bill|AWB(?:\s*Number)?|Air\s*Waybill|WBN|Tracking\s*(?:No|#)|Wb\s*No)\s*[:#\.\-]?\s*([0-9]{8,12})/i);
    if (bdAwbMatch && bdAwbMatch[1]) {
      result.awb = bdAwbMatch[1].trim();
    } else {
      const bdFallback = rawText.match(/\b([0-9]{9,11})\b/);
      if (bdFallback && bdFallback[1]) {
        result.awb = bdFallback[1].trim();
      }
    }
  } else if (detected === 'DELHIVERY') {
    // Delhivery AWB: e.g. "AWB Number: 34084710004874", "AWB: 1412345678901"
    const delAwbMatch = rawText.match(/(?:AWB(?:\s*Number)?|Waybill|LR\s*No|Tracking\s*(?:No|#)|Order\s*ID)\s*[:#\.\-]?\s*([0-9]{12,15})/i);
    if (delAwbMatch && delAwbMatch[1]) {
      result.awb = delAwbMatch[1].trim();
    } else {
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

  // ================= 2. CONSIGNOR (SENDER / BILL FROM) =================
  // Delhivery / Tax Invoice: BILL FROM section
  const billFromSection = rawText.match(
    /(?:BILL\s*FROM|SOLD\s*BY|DISPATCHED\s*FROM|SHIPPER|CONSIGNOR)\s*[:\-]?\s*([\s\S]+?)(?=(?:SHIPPING\s*ADDRESS|BILLING\s*ADDRESS|BILL\s*TO|SHIP\s*TO|ORDER\s*DETAILS|$))/i
  );

  if (billFromSection && billFromSection[1]) {
    const lines = billFromSection[1]
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.match(/^(email:|gst\s*number:|phone:)/i));

    if (lines.length > 0) {
      result.consignorName = lines[0]; // e.g. "Maa Sharda Enterprises"
      const addrLines = lines.slice(1);
      if (addrLines.length > 0) {
        result.consignorAddress = addrLines.join(', ');
      }
    }
  } else {
    // Fallback consignor match
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
  }

  // Consignor GSTIN & Origin City
  const gstinMatch = rawText.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
  if (gstinMatch && gstinMatch[1]) {
    result.consignorGstin = gstinMatch[1].trim();
  }

  // Origin detection (from Consignor address or explicit Origin label)
  const originMatch = rawText.match(/(?:Origin|From\s*Station|From\s*City|Shipped\s*From)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|Dest|To|,|$)/i);
  if (originMatch && originMatch[1]) {
    const cleanOrigin = originMatch[1].trim().toUpperCase();
    if (cleanOrigin.length >= 2 && cleanOrigin.length <= 25) {
      result.origin = cleanOrigin;
    }
  } else if (result.consignorAddress) {
    // Look for city in consignor address (e.g. Nagod, Satna)
    if (result.consignorAddress.toUpperCase().includes('NAGOD')) {
      result.origin = 'NAGOD';
    } else if (result.consignorAddress.toUpperCase().includes('SATNA')) {
      result.origin = 'SATNA';
    } else {
      const pinMatch = result.consignorAddress.match(/\b([1-9][0-9]{5})\b/);
      if (pinMatch) {
        const words = result.consignorAddress.split(/[\s,]+/);
        const pinIndex = words.findIndex(w => w.includes(pinMatch[1]));
        if (pinIndex > 0 && words[pinIndex - 1].length > 2) {
          result.origin = words[pinIndex - 1].replace(/[^A-Za-z]/g, '').toUpperCase();
        }
      }
    }
  }

  // ================= 3. CONSIGNEE (RECEIVER / SHIPPING ADDRESS) =================
  // CRITICAL: Look strictly for SHIPPING ADDRESS and STOP before BILLING ADDRESS or ORDER DETAILS
  // This prevents repeating the address when billing & shipping are identical!
  const shippingSectionMatch = rawText.match(
    /(?:SHIPPING\s*ADDRESS|SHIP\s*TO|DELIVER(?:Y)?\s*TO)\s*[:\-]?\s*([\s\S]+?)(?=(?:BILLING\s*ADDRESS|BILL\s*TO|ORDER\s*DETAILS|ITEM\s*DESCRIPTION|PAYMENT\s*TYPE|POWERED\s*BY|$))/i
  );

  if (shippingSectionMatch && shippingSectionMatch[1]) {
    const rawShippingBlock = shippingSectionMatch[1].trim();
    const lines = rawShippingBlock
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.match(/^(billing|shipping|order|sales|payment|awb|tax|invoice)/i));

    if (lines.length > 0) {
      result.consigneeName = lines[0]; // e.g. "Gurvinder singh"
      const addrLines = lines.slice(1);
      if (addrLines.length > 0) {
        result.consigneeAddress = cleanAddressString(addrLines.join(', '), result.consigneeName);
      } else {
        // Single-line block fallback
        const firstLine = lines[0];
        const words = firstLine.split(/\s+/);
        if (words.length >= 4) {
          result.consigneeName = words.slice(0, 2).join(' ');
          result.consigneeAddress = cleanAddressString(words.slice(2).join(' '), result.consigneeName);
        }
      }
    }
  } else {
    // Standard consignee pattern fallback with strict word boundaries
    const consigneeNameMatch = rawText.match(
      /(?:Consignee(?:\s*Name)?|Receiver|Customer(?:\s*Name)?|\bTo\b\s*[:\-])\s*[:\-]?\s*([A-Za-z0-9\s\.\-&]{3,40}?)(?:\n|Address|Phone|Contact|Ph|Mob|Tel|Pin|$)/i
    );
    if (consigneeNameMatch && consigneeNameMatch[1]) {
      const name = consigneeNameMatch[1].trim();
      // Ensure name is NOT a payment keyword or total
      if (
        !name.match(/^(address|phone|tel|dtdc|blue dart|delhivery|total|powered|sales|item|payment|order|tax|invoice|discount)/i) &&
        !name.includes('INR') &&
        !name.includes('Powered by') &&
        !name.includes('Total')
      ) {
        result.consigneeName = name;
      }
    }

    const consigneeAddrMatch = rawText.match(
      /(?:Consignee[\s\S]*?Address|Delivery\s*Address)\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+){0,2})/i
    );
    if (consigneeAddrMatch && consigneeAddrMatch[1]) {
      result.consigneeAddress = cleanAddressString(consigneeAddrMatch[1], result.consigneeName);
    }
  }

  // Safety check on consigneeName: Never allow "Total INR" or "Powered by" or "tal INR"
  if (result.consigneeName) {
    if (
      result.consigneeName.match(/^(total|powered|sales|item|payment|order|tax|invoice|discount)/i) ||
      result.consigneeName.includes('INR') ||
      result.consigneeName.includes('Powered')
    ) {
      result.consigneeName = '';
    }
  }

  // Ensure consigneeAddress is clean and deduplicated
  if (result.consigneeAddress) {
    result.consigneeAddress = cleanAddressString(result.consigneeAddress, result.consigneeName);
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

  // Destination detection (from consignee address PIN or explicit Destination label)
  const destMatch = rawText.match(/(?:Dest(?:ination)?|To\s*Station|To\s*City|Delivery\s*City|Destn)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|Product|Type|Weight|Date|,|$)/i);
  if (destMatch && destMatch[1]) {
    const cleanDest = destMatch[1].trim().toUpperCase();
    if (cleanDest.length >= 2 && cleanDest.length <= 25) {
      result.dest = cleanDest;
    }
  } else if (result.consigneeAddress) {
    const addrUpper = result.consigneeAddress.toUpperCase();
    if (addrUpper.includes('AMBALA')) {
      result.dest = 'AMBALA';
    } else if (addrUpper.includes('KHUDA KALAN')) {
      result.dest = 'KHUDA KALAN';
    } else {
      const pinMatch = result.consigneeAddress.match(/\b([1-9][0-9]{5})\b/);
      if (pinMatch) {
        const words = result.consigneeAddress.split(/[\s,]+/);
        const pinIndex = words.findIndex(w => w.includes(pinMatch[1]));
        if (pinIndex > 0 && words[pinIndex - 1].length > 2) {
          result.dest = words[pinIndex - 1].replace(/[^A-Za-z]/g, '').toUpperCase();
        }
      }
    }
  }

  // ================= 4. PRODUCT, TYPE & MODE =================
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

  // ================= 5. WEIGHT & PIECES =================
  const actualWtMatch = rawText.match(/(?:Actual\s*Weight|Weight|Gross\s*Wt|Wt)\s*[:\-]?\s*([0-9\.]+\s*(?:Gms|Kgs|kg|gm|KG))/i);
  if (actualWtMatch && actualWtMatch[1]) {
    result.actualWeight = actualWtMatch[1].trim();
  }

  const chargedWtMatch = rawText.match(/(?:Charged\s*Weight|Chargeable\s*Wt|Vol\s*Weight)\s*[:\-]?\s*([0-9\.]+\s*(?:Gms|Kgs|kg|gm|KG))/i);
  if (chargedWtMatch && chargedWtMatch[1]) {
    result.chargedWeight = chargedWtMatch[1].trim();
  }

  // Pieces: check Qty or No of Pieces
  const piecesMatch = rawText.match(/(?:No\s*Of\s*Pieces|Pieces|Pcs|Quantity|Qty)\s*[:\-]?\s*([0-9]+)/i);
  if (piecesMatch && piecesMatch[1]) {
    result.pieces = piecesMatch[1].trim();
  }

  // ================= 6. CONTENT SPECIFICATION & VALUE =================
  const contentMatch = rawText.match(/(?:Item\s*Desc(?:ription)?|Content\s*(?:Specification)?|Description|Commodity)\s*[:\-]?\s*([A-Za-z0-9\s,\-]+?)(?:\n|SKU|Qty|Declared|Value|Weight|Pieces|Date|Rs|₹|Total|$)/i);
  if (contentMatch && contentMatch[1]) {
    const cleanContent = contentMatch[1].trim();
    if (cleanContent.length >= 2 && cleanContent.length <= 40 && !cleanContent.match(/^(sku|qty|rate|tax|total)/i)) {
      result.contentSpec = cleanContent.toUpperCase();
    }
  }

  const declaredMatch = rawText.match(/(?:Declared\s*Value|Total(?:\s*INR)?|Invoice\s*Value|COD\s*Amount)\s*[:\-]?\s*(?:Rs\.?|₹|INR)?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (declaredMatch && declaredMatch[1]) {
    result.declaredValue = declaredMatch[1].trim();
  }

  // ================= 7. COURIER CHARGES =================
  const chargesMatch = rawText.match(/(?:Courier\s*Charges|Freight|Booking\s*Charge)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (chargesMatch && chargesMatch[1]) {
    result.courierCharges = parseFloat(chargesMatch[1]);
  }

  // ================= 8. DATE =================
  const dateMatch = rawText.match(/(?:Date|Sale\s*Date)\s*[:\-]?\s*(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}|\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4}|[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4})/i);
  if (dateMatch && dateMatch[1]) {
    result.date = dateMatch[1].trim();
  }

  return result;
}

// Backward compatibility alias for existing code
export const parseDtdcOcrText = parseCourierOcrText;
