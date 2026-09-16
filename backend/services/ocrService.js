
import sharp from "sharp";
import { createWorker } from "tesseract.js";

export const processInvoiceOCR = async (imageBuffer) => {
  if (!imageBuffer) {
    throw new Error("Invoice image is required");
  }

  // Image preprocessing for better OCR
  const processedImage = await sharp(imageBuffer)
    .grayscale()
    .normalize()
    .sharpen()
    .resize({
      width: 2000,
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(processedImage);

    return {
      text: result.data.text || "",
      confidence: result.data.confidence || 0,
    };
  } finally {
    await worker.terminate();
  }
};

