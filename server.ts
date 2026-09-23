import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Safe process-level error listeners to prevent unexpected server termination
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Keep-alive heartbeat
  app.get('/api/heartbeat', (req, res) => {
    res.json({ status: 'alive' });
  });

  // Smart AI OCR Extraction endpoint supporting DTDC, Blue Dart, and Delhivery
  app.post('/api/ocr', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/png', courier = 'AUTO' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server',
          fallback: true
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Clean base64 data prefix regardless of image or pdf mime type
      const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const isPdf = mimeType === 'application/pdf' || imageBase64.startsWith('data:application/pdf');
      const finalMimeType = isPdf ? 'application/pdf' : (mimeType || 'image/png');

      const prompt = `You are an expert OCR parser for Indian courier shipping receipts, invoices, and shipping labels.
You specialize in DTDC, Blue Dart, and Delhivery documents (Active courier preference: ${courier}).
Analyze the provided image/document and extract all courier information into pure JSON without markdown code fences.

Courier detection guidelines:
- DTDC: Usually has "DTDC" branding, AWB starts with 7D, 7X, or 7 followed by 8-11 digits/letters. Products: B2C SMART EXPRESS, B2C PRIORITY, DOMESTIC.
- Blue Dart: Has "Blue Dart" or "Air Waybill" branding. AWB/Waybill is typically 8 to 11 digits (e.g. 7839420194, 84930192834, 351249821). Products: APEX, DOMESTIC PRIORITY, SURFACE, SMART BOX.
- Delhivery: Has "Delhivery" or "Powered by Delhivery" branding. AWB/Waybill is typically 12 to 15 digits (e.g. 1412345678901, 34084710004874). Products: Express Parcel, Heavy Surface, Standard.

CRITICAL INVOICE ADDRESS EXTRACTION RULES (IMPORTANT):
- Invoices frequently show BOTH "SHIPPING ADDRESS" and "BILLING ADDRESS" side-by-side or one after another.
- consigneeName and consigneeAddress MUST be extracted ONLY from "SHIPPING ADDRESS" (or "SHIP TO").
- NEVER concatenate, combine, or repeat the address even if "BILLING ADDRESS" is identical or also present.
- Strip out any labels like "BILLING ADDRESS", "SHIPPING ADDRESS", "ORDER DETAILS".
- consigneeAddress must contain the destination address lines ONLY ONCE (absolutely no duplicate repetitions).
- "BILL FROM", "SOLD BY", or "DISPATCHED FROM" is the Consignor / Sender. Extract company name into consignorName, full address into consignorAddress, and GSTIN into consignorGstin.

Extract these exact fields into JSON:
- detectedCourier: "DTDC" | "BLUEDART" | "DELHIVERY"
- awb: Airway Bill / Waybill / LR Number (e.g. 34084710004874, 7D134850071)
- origin: Origin city (e.g. SATNA, NAGOD, MUMBAI, DELHI)
- dest: Destination city or hub (e.g. AMBALA, MEHSANA, KOTA)
- product: Product type (e.g. Express Parcel, APEX, DOMESTIC PRIORITY, B2C SMART EXPRESS, SURFACE)
- type: "DOCUMENT" or "NON-DOCUMENT"
- mode: "AIR" or "SURFACE"
- date: Date string found on receipt (e.g. 2026-9-23, Sat Sep 19 2026)
- consigneeName: Full name of consignee / recipient (from SHIPPING ADDRESS only)
- consigneeAddress: Full clean single address of consignee (from SHIPPING ADDRESS only, NO billing address, NO duplicates)
- consigneePhone: Phone / mobile number of consignee
- consignorName: Sender / Shipper / Consignor name (from BILL FROM or SOLD BY)
- consignorAddress: Sender address (from BILL FROM)
- consignorPhone: Sender phone / mobile
- consignorGstin: Sender GSTIN if visible (e.g. 23BCPPD5853C1ZT)
- contentSpec: Content specification / description (e.g. Milk analyser, LAPTOP, DOCUMENTS)
- declaredValue: Declared value number or total amount (e.g. 10000)
- pieces: Number of pieces (e.g. 1)
- actualWeight: Actual weight string (e.g. 0.23 Kgs, 2.5 Kgs, 500 Gms)
- chargedWeight: Charged weight string (e.g. 0.23 Kgs, 2.715 Kgs, 500 Gms)
- dim: Dimensions string (e.g. 10x10x10 cm, Not Applicable)
- courierCharges: Courier charges or freight amount number if visible

Return ONLY valid JSON matching this schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: finalMimeType,
                  data: cleanData
                }
              },
              {
                text: prompt
              }
            ]
          }
        ]
      });

      const responseText = response.text?.trim() || '{}';
      const jsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(jsonText);

      // Server-side safety deduplication for consigneeAddress
      if (parsedData.consigneeAddress) {
        let addr = parsedData.consigneeAddress
          .replace(/(?:BILLING\s*ADDRESS|BILL\s*TO\s*ADDRESS|BILL\s*TO|ORDER\s*DETAILS)[\s\S]*/i, '')
          .replace(/^(?:SHIPPING\s*ADDRESS|SHIP\s*TO\s*ADDRESS|SHIP\s*TO|DELIVERY\s*ADDRESS|ADDRESS)\s*[:\-]?\s*/i, '')
          .trim();

        if (parsedData.consigneeName) {
          const esc = parsedData.consigneeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          addr = addr.replace(new RegExp(`^${esc}\\s*[,\\-\\n\\s]*`, 'i'), '');
        }

        const parts = addr.split(/[,;\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
        const seen = new Set<string>();
        const deduped: string[] = [];
        for (const p of parts) {
          const lower = p.toLowerCase();
          if (lower === 'billing address' || lower === 'shipping address') continue;
          if (!seen.has(lower)) {
            seen.add(lower);
            deduped.push(p);
          }
        }
        parsedData.consigneeAddress = deduped.join(', ');
      }

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('OCR Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to process OCR' });
    }
  });

  // Catch unmatched API routes so they return JSON instead of SPA HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteError) {
      console.error('[Server] Failed to initialize Vite dev server middleware:', viteError);
      throw viteError;
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build assets not found in dist/. Run "npm run build" first.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DTDC Bill Generator Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use.`);
    } else {
      console.error('[Server] Listen error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal initialization error:', err);
  process.exit(1);
});
