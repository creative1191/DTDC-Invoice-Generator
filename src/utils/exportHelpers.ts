import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DTDCBillData } from '../types';
import { formatAmount } from '../components/DtdcBillLayout';
import { COURIER_CONFIGS } from '../data/courierConfigs';

/**
 * Downloads a high-resolution PNG of the courier bill.
 */
export async function downloadBillAsPng(
  element: HTMLElement,
  data: DTDCBillData,
  isHighRes: boolean = true
) {
  try {
    const courier = data.courier || 'DTDC';
    const config = COURIER_CONFIGS[courier] || COURIER_CONFIGS.DTDC;
    const scale = isHighRes ? 3 : 2; // 3x = ~300 DPI
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const safeName = (data.consignorName || config.shortName)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20);
    const dest = (data.dest || 'SHIP').replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${config.shortName}_${safeName}_${data.courierCharges || 0}rs_${dest}_${isHighRes ? 'HighRes' : 'Std'}.png`;

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = filename;
    link.click();
    return true;
  } catch (err) {
    console.error('Failed to export PNG:', err);
    throw err;
  }
}

/**
 * Downloads a vector / pixel-perfect PDF of the courier bill (A4 Portrait or Landscape).
 */
export async function downloadBillAsPdf(element: HTMLElement, data: DTDCBillData) {
  try {
    const courier = data.courier || 'DTDC';
    const config = COURIER_CONFIGS[courier] || COURIER_CONFIGS.DTDC;
    const isLandscape = data.layoutMode === 'SINGLE_LANDSCAPE';
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    // Calculate fitted dimensions
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    let renderW = pdfWidth - 8;
    let renderH = renderW / ratio;

    if (renderH > pdfHeight - 8) {
      renderH = pdfHeight - 8;
      renderW = renderH * ratio;
    }

    const posX = (pdfWidth - renderW) / 2;
    const posY = 4;

    pdf.addImage(imgData, 'PNG', posX, posY, renderW, renderH);

    const safeName = (data.consignorName || config.shortName)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20);
    const dest = (data.dest || 'SHIP').replace(/[^a-zA-Z0-9]/g, '');
    const suffix = data.layoutMode === '3_COPIES_PORTRAIT' ? '_3Copies' : '';
    const filename = `${config.shortName}_${safeName}_${data.courierCharges || 0}rs_${dest}${suffix}.pdf`;

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to export PDF:', err);
    throw err;
  }
}

/**
 * Downloads standalone editable HTML template.
 */
export function downloadBillAsHtml(data: DTDCBillData) {
  const courier = data.courier || 'DTDC';
  const config = COURIER_CONFIGS[courier] || COURIER_CONFIGS.DTDC;
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${config.shortName} Bill - ${data.awb}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .bill { background: #fff; border: 2px solid #000; padding: 12px; max-width: 900px; margin: 0 auto; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
    .charges-box { border: 2px solid #000; padding: 6px 14px; font-weight: bold; font-size: 16px; display: inline-block; }
    .table { width: 100%; border-collapse: collapse; text-align: center; font-size: 12px; margin: 8px 0; }
    .table th, .table td { border: 1px solid #000; padding: 4px; }
  </style>
</head>
<body>
  <div class="bill">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px;">
      <h2 style="margin:0; color:${config.themeColor};">${config.fullName.toUpperCase()} - ${config.docTitle}</h2>
      <div><strong>${config.awbLabel}: ${data.awb}</strong> | Mode: ${data.mode} | Date: ${data.date}</div>
    </div>
    <div class="grid">
      <div>
        <strong>CONSIGNOR:</strong> ${data.consignorName}<br>
        Address: <strong>${data.consignorAddress}</strong><br>
        Contact: ${data.consignorPhone}<br>
        Origin: ${data.origin} | Depot: ${data.senderDepot}
      </div>
      <div>
        <strong>CONSIGNEE:</strong> ${data.consigneeName}<br>
        Address: <strong>${data.consigneeAddress}</strong><br>
        Contact: ${data.consigneePhone}<br>
        Destination: ${data.dest}
      </div>
    </div>
    <table class="table">
      <thead>
        <tr><th>Content</th><th>Declared</th><th>Pieces</th><th>Actual Wt</th><th>Charged Wt</th><th>Dimensions</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.contentSpec}</td>
          <td>${data.declaredValue}</td>
          <td>${data.pieces}</td>
          <td>${data.actualWeight}</td>
          <td>${data.chargedWeight}</td>
          <td>${data.dim}</td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
      <div class="charges-box">
        Courier Charges: ₹ ${formatAmount(data.courierCharges)}
      </div>
      <div>
        Risk Surcharge: [${data.riskSurchargeOwner ? '✓' : ' '}] Owner's Risk [${data.riskSurchargeCarrier ? '✓' : ' '}] Carrier's Risk
      </div>
    </div>
    <div style="margin-top:10px; font-size:11px; text-align:center; color:#555;">
      ${config.footerNotice}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${config.shortName}_${data.awb}_${data.dest}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
