import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_ADMIN_KEY,
});

export const parseInvoiceWithAI = async (ocrText) => {
  if (!ocrText) {
    throw new Error("OCR text is required");
  }

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: `
You are an invoice data extraction assistant.

Extract ONLY these fields:

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
1. Return valid JSON only.
2. amount_before_gst must be the taxable amount before GST.
3. gst_rate must be the GST percentage.
4. amount_after_gst must be the amount including GST.
5. If a value cannot be identified, use null.
6. Do not calculate or invent missing values.
`,
      },
      {
        role: "user",
        content: ocrText,
      },
    ],
  });

  const result = response.output_text;

  return JSON.parse(result);
};