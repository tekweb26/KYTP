import { createWorker } from "tesseract.js";

export const processInvoiceOCR = async (imageBuffer) => {
  if (!imageBuffer) {
    throw new Error("Invoice image is required");
  }

  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(imageBuffer);

    return {
      text: result.data.text || "",
      confidence: result.data.confidence || 0,
    };
  } finally {
    await worker.terminate();
  }
};