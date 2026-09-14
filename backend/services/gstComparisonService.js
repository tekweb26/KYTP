import { calculateGST } from "./gstCalculationService.js";

const round2 = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

export const compareGSTCalculation = ({
  amountBeforeGST,
  gstRate,
  aiAmountAfterGST,
  taxType = "IGST",
}) => {
  const calculated = calculateGST({
    amountBeforeGST,
    gstRate,
    taxType,
  });

  const aiAmount = round2(aiAmountAfterGST);
  const calculatedAmount = round2(calculated.amount_after_gst);

  const difference = round2(aiAmount - calculatedAmount);

  const isMatch = Math.abs(difference) <= 0.01;

  return {
    ai: {
      amount_before_gst: round2(amountBeforeGST),
      gst_rate: Number(gstRate),
      amount_after_gst: aiAmount,
    },

    calculated,

    comparison: {
      is_match: isMatch,
      difference,
      status: isMatch ? "MATCH" : "MISMATCH",
    },
  };
};