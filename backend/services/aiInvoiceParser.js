import { GoogleGenAI } from "@google/genai";

export const parseInvoiceWithAI = async (
  ocrText,
  imageBuffer,
  mimeType = "image/jpeg"
) => {
  if (!ocrText) {
    throw new Error("OCR text is required");
  }

  if (!imageBuffer) {
    throw new Error("Invoice image is required");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const imageBase64 = imageBuffer.toString("base64");

  const prompt = `
You are an expert Indian GST invoice extraction AI.

IMPORTANT:
You have TWO sources:
1. The original invoice IMAGE
2. OCR text extracted from that image

The ORIGINAL IMAGE is the source of truth.
OCR text can contain serious digit/zero errors.

Your job is to visually inspect the invoice image and extract the EXACT values.

CRITICAL TAXABLE AMOUNT RULES:
- NEVER blindly trust OCR numbers.
- If OCR says 2000 but the invoice image clearly shows 20, return 20.
- Do NOT add or remove zeros.
- Preserve decimal values exactly.
- Carefully inspect the item's Quantity, Rate, Taxable Value/Amount, GST %, GST Amount and Total columns.
- If quantity × rate does not match the OCR value, inspect the IMAGE again.
- The printed value in the IMAGE has priority over mathematical assumptions.
- Do not "correct" a printed invoice value using your own calculation.
- GST calculations may be used only as a cross-check.
- If the image clearly shows ₹20, return "20", NOT "2000".

Extract:

- invoice_number
- invoice_date
- vendor_name
- vendor_gstin
- items

For every item extract:
- description
- hsn_sac
- quantity
- rate
- amount_before_gst
- gst_rate
- gst_amount
- amount_after_gst

For amount_before_gst:
Use the actual Taxable Value / Amount printed for that item in the invoice image.

For gst_amount:
Use the GST amount printed in the invoice image when available.

For amount_after_gst:
Use the actual final/item total printed in the invoice image when available.

Do not guess values that cannot be reliably read.

Return ONLY valid JSON in exactly this structure:

{
  "invoice_number": null,
  "invoice_date": null,
  "vendor_name": null,
  "vendor_gstin": null,
  "items": [
    {
      "description": null,
      "hsn_sac": null,
      "quantity": null,
      "rate": null,
      "amount_before_gst": null,
      "gst_rate": null,
      "gst_amount": null,
      "amount_after_gst": null
    }
  ]
}

OCR TEXT:
${ocrText}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",

    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: prompt,
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

  try {
    return JSON.parse(result);
  } catch (error) {
    console.error("Gemini JSON Parse Error:", result);
    throw new Error("Gemini returned invalid JSON");
  }
};