import { jsPDF } from 'jspdf';

export interface ExportableLabelItem {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
  title: string;
}

/**
 * Generates an image with rotation baked in via HTML5 Canvas
 */
async function getRotatedImageDataUrl(dataUrl: string, rotationDeg: number): Promise<string> {
  if (rotationDeg % 360 === 0) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rad = (rotationDeg * Math.PI) / 180;
      const is90or270 = Math.abs(rotationDeg % 180) === 90;

      canvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Exports queued labels as a multi-page A4 PDF formatted in a 2x2 (4-up) vertical grid.
 * Only prints slots filled with labels, never creating dummy placeholders.
 */
export async function exportLabelsToA4Pdf(
  labels: ExportableLabelItem[],
  filename: string = 'shipping-labels-4up.pdf',
  showCutLines: boolean = true
): Promise<void> {
  if (!labels.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 6;
  const marginY = 6;
  const colGap = 4;
  const rowGap = 4;

  const slotWidth = (pageWidth - marginX * 2 - colGap) / 2; // ~97mm
  const slotHeight = (pageHeight - marginY * 2 - rowGap) / 2; // ~140.5mm

  const slotsPerPage = 4;
  const totalPages = Math.ceil(labels.length / slotsPerPage);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    const startIdx = pageIdx * slotsPerPage;
    const pageLabels = labels.slice(startIdx, startIdx + slotsPerPage);

    for (let slotIdx = 0; slotIdx < pageLabels.length; slotIdx++) {
      const label = pageLabels[slotIdx];
      const col = slotIdx % 2;
      const row = Math.floor(slotIdx / 2);

      const cellX = marginX + col * (slotWidth + colGap);
      const cellY = marginY + row * (slotHeight + rowGap);

      // Optional subtle cutting guidelines
      if (showCutLines) {
        doc.setDrawColor(200, 205, 215);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(cellX, cellY, slotWidth, slotHeight);
      }

      // Prepare image with rotation
      const finalDataUrl = await getRotatedImageDataUrl(label.dataUrl, label.rotation || 0);

      // Measure dimensions
      const is90or270 = Math.abs((label.rotation || 0) % 180) === 90;
      const effectiveW = is90or270 ? label.height : label.width;
      const effectiveH = is90or270 ? label.width : label.height;

      const innerPadding = 3; // 3mm internal safety margin
      const maxW = slotWidth - innerPadding * 2;
      const maxH = slotHeight - innerPadding * 2;

      let drawW = maxW;
      let drawH = (effectiveH / (effectiveW || 1)) * maxW;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = (effectiveW / (effectiveH || 1)) * maxH;
      }

      const drawX = cellX + (slotWidth - drawW) / 2;
      const drawY = cellY + (slotHeight - drawH) / 2;

      doc.addImage(finalDataUrl, 'PNG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    }
  }

  doc.save(filename);
}
