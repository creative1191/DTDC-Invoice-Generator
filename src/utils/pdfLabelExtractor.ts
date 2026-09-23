import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore Vite query suffix for asset url
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the PDF.js worker safely
if (typeof window !== 'undefined') {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        typeof pdfWorkerUrl === 'string'
          ? pdfWorkerUrl
          : `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  } catch (err) {
    console.warn('[PDF.js] Worker setup warning:', err);
  }
}

export interface ExtractedLabelPage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
  sourceName: string;
}

/**
 * Extracts each page of an uploaded PDF file as a high-resolution PNG data URL.
 * Renders at 2.5x scale (approx 200-300 DPI) for crisp thermal/barcode printing.
 */
export async function extractPagesFromPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedLabelPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  let loadingTask: any = null;
  
  try {
    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: ExtractedLabelPage[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, totalPages);
      }

      const page = await pdf.getPage(pageNum);
      // Use 2.5 scale for sharp barcode and small text readability on standard A4 paper
      const viewport = page.getViewport({ scale: 2.5 });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      // Fill white background to prevent transparent PDF backgrounds
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas,
      };

      // Render page
      await page.render(renderContext).promise;

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      pages.push({
        id: `${file.name}-p${pageNum}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        pageNumber: pageNum,
        sourceName: `${file.name} (Page ${pageNum}/${totalPages})`,
      });
    }

    return pages;
  } catch (err: any) {
    console.error('[PDF.js] Error extracting pages from PDF:', err);
    throw new Error(err?.message || 'Failed to render PDF pages');
  } finally {
    if (loadingTask && typeof loadingTask.destroy === 'function') {
      try {
        loadingTask.destroy();
      } catch {
        // Ignore cleanup error
      }
    }
  }
}

/**
 * Reads an uploaded or pasted image File / Blob and returns a high-resolution ExtractedLabelPage
 */
export async function extractFromImageFile(
  blob: Blob | File,
  sourceName: string = 'Uploaded Image'
): Promise<ExtractedLabelPage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dataUrl,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          pageNumber: 1,
          sourceName,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Extracts searchable text and renders the first page of a PDF into a high-res PNG data URL.
 * Enables both instant vector text extraction and AI image OCR for courier invoices / labels.
 */
export async function extractTextAndImageFromPdf(
  file: Blob | File
): Promise<{ text: string; dataUrl: string; totalPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  let loadingTask: any = null;

  try {
    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    let fullText = '';
    // Extract text from pages (up to first 3 pages) with proper newline preservation
    const pagesToRead = Math.min(totalPages, 3);
    for (let p = 1; p <= pagesToRead; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY: number | null = null;

      for (const item of textContent.items as any[]) {
        if (!item || typeof item.str !== 'string') continue;
        const currentY = Array.isArray(item.transform) ? Math.round(item.transform[5]) : null;
        
        // If vertical position changes significantly or item has End-Of-Line, insert newline
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (item.hasEOL) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }

        pageText += item.str;
        if (currentY !== null) {
          lastY = currentY;
        }
      }

      fullText += `\n--- Page ${p} ---\n` + pageText;
    }

    // Render Page 1 to canvas at 2.5x scale for preview and visual OCR
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 2.5 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not create canvas 2d context for PDF rendering');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await firstPage.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png', 0.95);

    return {
      text: fullText.trim(),
      dataUrl,
      totalPages,
    };
  } catch (err: any) {
    console.error('[PDF.js] Failed to extract text/image from PDF:', err);
    throw new Error(err?.message || 'Could not parse PDF content');
  } finally {
    if (loadingTask && typeof loadingTask.destroy === 'function') {
      try {
        loadingTask.destroy();
      } catch {
        // Ignore destroy error
      }
    }
  }
}
