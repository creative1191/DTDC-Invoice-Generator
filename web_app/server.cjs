var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/heartbeat", (req, res) => {
    res.json({ status: "alive" });
  });
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/png" } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "GEMINI_API_KEY not configured on server",
          fallback: true
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
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
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
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
      const responseText = response.text?.trim() || "{}";
      const jsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(jsonText);
      return res.json({ success: true, data: parsedData });
    } catch (err) {
      console.error("OCR Error:", err);
      return res.status(500).json({ error: err.message || "Failed to process OCR" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DTDC Bill Generator Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
