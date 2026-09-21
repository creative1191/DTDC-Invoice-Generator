import { ExportableLabelItem } from './pdfLabelExport';

/**
 * Generates an authentic canvas-based sample shipping label for quick previewing and testing
 */
export function generateSampleCourierLabel(
  courier: 'DTDC' | 'BlueDart' | 'Delhivery' | 'Amazon',
  awb: string,
  destinationCity: string,
  pincode: string
): ExportableLabelItem {
  const canvas = document.createElement('canvas');
  // High-res canvas: 400x600 px (standard 4x6 vertical ratio 2:3)
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 900);

  // Outer Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 880);

  // Top Header Banner
  let brandColor = '#da291c'; // DTDC red
  let brandName = 'DTDC EXPRESS LTD';
  let serviceType = 'STANDARD EXPRESS (7D)';

  if (courier === 'BlueDart') {
    brandColor = '#065dac';
    brandName = 'BLUE DART EXPRESS';
    serviceType = 'DOMESTIC PRIORITY AIR';
  } else if (courier === 'Delhivery') {
    brandColor = '#ea4333';
    brandName = 'DELHIVERY LOGISTICS';
    serviceType = 'SURFACE HEAVY / E-COM';
  } else if (courier === 'Amazon') {
    brandColor = '#232f3e';
    brandName = 'AMAZON SHIPPING';
    serviceType = 'EXPEDITED DELIVERY';
  }

  // Header band
  ctx.fillStyle = brandColor;
  ctx.fillRect(10, 10, 580, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.fillText(brandName, 25, 58);

  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(serviceType, 570, 56);
  ctx.textAlign = 'left';

  // Routing Code & Pincode Box
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(14, 88, 572, 90);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 88, 572, 90);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DESTINATION PINCODE / ROUTING', 25, 115);

  ctx.font = '900 48px "Segoe UI", Arial, sans-serif';
  ctx.fillText(pincode, 25, 165);

  ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(destinationCity.toUpperCase(), 565, 160);
  ctx.textAlign = 'left';

  // AWB Barcode Simulation (crisp lines)
  ctx.fillStyle = '#000000';
  const barcodeY = 195;
  const barcodeHeight = 90;
  // Generate random bar pattern based on awb
  let currentX = 50;
  for (let i = 0; i < awb.length * 3; i++) {
    const charCode = awb.charCodeAt(i % awb.length) + i;
    const barWidth = (charCode % 4) + 2;
    const spaceWidth = ((charCode * 3) % 3) + 2;
    ctx.fillRect(currentX, barcodeY, barWidth, barcodeHeight);
    currentX += barWidth + spaceWidth;
    if (currentX > 540) break;
  }

  // AWB Text
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`AWB: ${awb}`, 300, 315);
  ctx.textAlign = 'left';

  // Divider line
  ctx.beginPath();
  ctx.moveTo(14, 335);
  ctx.lineTo(586, 335);
  ctx.stroke();

  // Ship To Address Box
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DELIVER TO (CONSIGNEE):', 25, 365);

  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('RECIPIENT / TRADERS LTD.', 25, 395);

  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Plot No. 42, Industrial Area, Phase II', 25, 425);
  ctx.fillText(`Near Metro Station, ${destinationCity} - ${pincode}`, 25, 455);
  ctx.fillText('Phone: +91 98765 43210 / 94251 00000', 25, 485);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(14, 510);
  ctx.lineTo(586, 510);
  ctx.stroke();

  // Shipper / Origin Box
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText('RETURN ADDRESS (SHIPPER):', 25, 535);
  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DHARMENDRA PRASAD (LOGISTICS HUB)', 25, 560);
  ctx.fillText('Near Circuit House, Rewa Road, Satna (M.P.) - 485001', 25, 585);

  // Package specs table
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(14, 610, 572, 110);
  ctx.strokeRect(14, 610, 572, 110);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText('WEIGHT:', 25, 640);
  ctx.fillText('PIECES:', 170, 640);
  ctx.fillText('DECLARED VALUE:', 320, 640);
  ctx.fillText('PAYMENT:', 470, 640);

  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('0.50 KG', 25, 675);
  ctx.fillText('1 BOX', 170, 675);
  ctx.fillText('Rs. 2,500', 320, 675);
  ctx.fillText('PREPAID', 470, 675);

  // Footer / Instructions
  ctx.fillStyle = '#374151';
  ctx.font = '13px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Handle with Care • Standard A4 4-Up Grid Sheet Slot', 25, 755);
  ctx.fillText('No signature required if left in secure location.', 25, 780);

  // Bottom miniature barcode
  currentX = 180;
  for (let i = 0; i < 35; i++) {
    const w = (i % 3) + 1;
    ctx.fillRect(currentX, 810, w, 40);
    currentX += w + ((i % 2) + 2);
  }
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`*${awb}*`, 300, 870);

  return {
    id: `sample-${courier}-${awb}`,
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    rotation: 0,
    title: `${brandName} - ${destinationCity}`,
  };
}

export function getInitialSampleLabels(): ExportableLabelItem[] {
  return [
    generateSampleCourierLabel('DTDC', 'D78392104', 'Mumbai', '400001'),
    generateSampleCourierLabel('BlueDart', '789124056', 'Bengaluru', '560001'),
    generateSampleCourierLabel('Delhivery', '14098234159', 'Delhi', '110001'),
    generateSampleCourierLabel('DTDC', 'D78392105', 'Hyderabad', '500001'),
  ];
}
