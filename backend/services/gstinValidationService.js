const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const validateGSTIN = (gstin) => {
  if (!gstin) {
    return {
      isValid: false,
      gstin: null,
      message: "GSTIN is missing",
    };
  }

  const cleanedGSTIN = String(gstin)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const isValid = GSTIN_REGEX.test(cleanedGSTIN);

  return {
    isValid,
    gstin: isValid ? cleanedGSTIN : null,
    message: isValid
      ? "GSTIN format is valid"
      : "Invalid GSTIN format",
  };
};