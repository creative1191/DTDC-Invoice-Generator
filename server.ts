import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DTDC Bill Generator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
