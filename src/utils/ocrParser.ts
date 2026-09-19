import { OCRMatchResult } from '../types';

/**
 * Parses OCR extracted text using the exact DTDC regex patterns specified in workflow logic.
 */
export function parseDtdcOcrText(rawText: string): OCRMatchResult {
  const result: OCRMatchResult = { rawText };

  if (!rawText || rawText.trim().length === 0) {
    return result;
  }

  // 1. AWB No. regex
  // Primary: AWB No. : 7D134850071 or AWB: 7X117632483
  // Secondary: any 7[A-Z0-9]{10,} or standard AWB pattern
  const awbPrimary = rawText.match(/AWB\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,})/i);
  if (awbPrimary && awbPrimary[1]) {
    result.awb = awbPrimary[1].trim().toUpperCase();
  } else {
    const awbSecondary = rawText.match(/\b(7[A-Z0-9]{9,12})\b/);
    if (awbSecondary && awbSecondary[1]) {
      result.awb = awbSecondary[1].trim().toUpperCase();
    }
  }

  // 2. Origin
  const originMatch = rawText.match(/Origin\s*:\s*([A-Za-z]+)/i);
  if (originMatch && originMatch[1]) {
    result.origin = originMatch[1].trim().toUpperCase();
  }

  // 3. Destination
  const destMatch = rawText.match(/Dest(?:ination)?\s*:\s*([A-Za-z]+)/i);
  if (destMatch && destMatch[1]) {
    result.dest = destMatch[1].trim().toUpperCase();
  }

  // 4. Product
  const productMatch = rawText.match(/PRODUCT\s*:\s*([A-Z0-9\s\-]+?)(?:\n|Type|Date|$)/i);
  if (productMatch && productMatch[1]) {
    result.product = productMatch[1].trim();
  }

  // 5. Type (DOCUMENT / NON-DOCUMENT)
  const typeMatch = rawText.match(/Type\s*:\s*([A-Za-z\-]+)/i);
  if (typeMatch && typeMatch[1]) {
    const t = typeMatch[1].trim().toUpperCase();
    result.type = t.includes('NON') ? 'NON-DOCUMENT' : 'DOCUMENT';
  }

  // 6. Mode (AIR / SURFACE)
  const modeMatch = rawText.match(/Mode\s*:\s*([A-Za-z]+)/i);
  if (modeMatch && modeMatch[1]) {
    result.mode = modeMatch[1].trim().toUpperCase();
  }

  // 7. Date (e.g. Sat Sep 19 2026 or Fri Jul 24 2026)
  const dateMatch = rawText.match(/Date\s*:\s*([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4})/i);
  if (dateMatch && dateMatch[1]) {
    result.date = dateMatch[1].trim();
  } else {
    // Alternate date pattern
    const altDate = rawText.match(/\b(\d{1,2}[\/\-][A-Za-z0-9]{3}[\/\-]\d{2,4})\b/);
    if (altDate) {
      result.date = altDate[1];
    }
  }

  // 8. Consignee Name
  const consigneeNameMatch = rawText.match(/Consignee[\s\S]*?Name\s*:\s*([A-Za-z0-9\s\.\-]+?)(?:\n|Address|$)/i);
  if (consigneeNameMatch && consigneeNameMatch[1]) {
    result.consigneeName = consigneeNameMatch[1].trim();
  }

  // 9. Consignee Address
  const consigneeAddrMatch = rawText.match(/Consignee[\s\S]*?Address\s*:\s*([^\n]+(?:\n[^\n]+){0,2})/i);
  if (consigneeAddrMatch && consigneeAddrMatch[1]) {
    result.consigneeAddress = consigneeAddrMatch[1].replace(/\r?\n/g, ', ').trim();
  }

  // 10. Consignee Phone / Contact
  const consigneePhoneMatch = rawText.match(/(?:Consignee[\s\S]*?(?:Phone|Contact|Mobile|Ph)\s*[:\-]?\s*|Phone\s*[:\-]?\s*)(\+?\d[\d\s\-]{8,13}\d)/i);
  if (consigneePhoneMatch && consigneePhoneMatch[1]) {
    result.consigneePhone = consigneePhoneMatch[1].replace(/[\s\-]/g, '').trim();
  }

  // 11. Content Specification
  const contentMatch = rawText.match(/Content\s*Specification\s*:\s*([A-Za-z0-9\s]+?)(?:\n|Declared|$)/i);
  if (contentMatch && contentMatch[1]) {
    result.contentSpec = contentMatch[1].trim().toUpperCase();
  }

  // 12. Declared Value
  const declaredMatch = rawText.match(/Declared\s*Value\s*:\s*([0-9]+|Not\s*Applicable)/i);
  if (declaredMatch && declaredMatch[1]) {
    result.declaredValue = declaredMatch[1].trim();
  }

  // 13. Pieces
  const piecesMatch = rawText.match(/No\s*Of\s*Pieces\s*:\s*([0-9]+|Not\s*Applicable)/i);
  if (piecesMatch && piecesMatch[1]) {
    result.pieces = piecesMatch[1].trim();
  }

  // 14. Actual Weight
  const actualWtMatch = rawText.match(/Actual\s*Weight\s*:\s*([0-9\.]+\s*(?:Gms|Kgs|kg|gm))/i);
  if (actualWtMatch && actualWtMatch[1]) {
    result.actualWeight = actualWtMatch[1].trim();
  }

  // 15. Charged Weight
  const chargedWtMatch = rawText.match(/Charged\s*weight\s*:\s*([0-9\.]+\s*(?:Gms|Kgs|kg|gm))/i);
  if (chargedWtMatch && chargedWtMatch[1]) {
    result.chargedWeight = chargedWtMatch[1].trim();
  }

  // 16. Dimensions
  const dimMatch = rawText.match(/Dim\s*:\s*([0-9xX\s\.cmCM]+|Not\s*Applicable)/i);
  if (dimMatch && dimMatch[1]) {
    result.dim = dimMatch[1].trim();
  }

  // 17. Courier Charges (if present)
  const chargesMatch = rawText.match(/(?:Courier\s*Charges|Charges|Rate|Amount)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (chargesMatch && chargesMatch[1]) {
    result.courierCharges = parseFloat(chargesMatch[1]);
  }

  return result;
}
