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

  // Smart AI OCR Extraction endpoint using Gemini API if key is available
  app.post('/api/ocr', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/png' } = req.body;
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

      // Clean base64 data prefix if present
      const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `You are an expert OCR parser for DTDC courier shipping receipts and labels.
Analyze the provided image and extract all courier information into pure JSON without markdown code fences.

Extract these exact fields:
- awb: Airway Bill Number (e.g. 7X117632483, 7D134850069, 7D134850071)
- origin: Origin city (e.g. SATNA)
- dest: Destination city (e.g. KOTA, TRICHUR, MEHSANA, DHAR)
- product: Product type (e.g. B2C SMART EXPRESS, B2C PRIORITY, DOMESTIC)
- type: Shipment type (DOCUMENT or NON-DOCUMENT)
- mode: Transport mode (AIR or SURFACE)
- date: Date string found on receipt (e.g. Sat Sep 19 2026)
- consigneeName: Full name of consignee / recipient
- consigneeAddress: Full address of consignee
- consigneePhone: Phone number of consignee
- consignorName: Sender name if present
- consignorAddress: Sender address if present
- consignorPhone: Sender phone if present
- contentSpec: Content specification (e.g. LAPTOP, ELECTRIC ITEMS, DOCUMENTS)
- declaredValue: Declared value number or "Not Applicable"
- pieces: Number of pieces (e.g. 1)
- actualWeight: Actual weight string (e.g. 0.23 Kgs, 2.5 Kgs, 100 Gms)
- chargedWeight: Charged weight string (e.g. 0.23 Kgs, 2.715 Kgs, 500 Gms)
- dim: Dimensions string (e.g. 52x31x8 cm, 10x10x10 cm, Not Applicable)
- courierCharges: Courier charges amount number if visible

Return ONLY valid JSON matching this schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
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
      const jsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(jsonText);

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
