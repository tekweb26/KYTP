import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const parseInvoiceWithAI = async (ocrText) => {
  if (!ocrText) {
    throw new Error("OCR text is required");
  }

  const response = await ai.models.generateContent({
   model: "gemini-3.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are an invoice data extraction assistant.

Extract ONLY these fields from the invoice OCR text:

- invoice_number
- invoice_date
- vendor_gstin
- vendor_name
- items:
  - amount_before_gst
  - gst_rate
  - amount_after_gst

Do NOT extract:
- description
- HSN/SAC
- quantity
- rate

Rules:
1. Return JSON only.
2. amount_before_gst means taxable amount before GST.
3. gst_rate must be the GST percentage.
4. amount_after_gst means amount including GST.
5. If a value cannot be identified, use null.
6. Do not invent missing values.

OCR TEXT:

${ocrText}
`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const result = response.text;

  if (!result) {
    throw new Error("Gemini returned empty response");
  }

  return JSON.parse(result);
};