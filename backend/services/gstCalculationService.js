const round2 = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

export const calculateGST = ({
  amountBeforeGST,
  gstRate,
  taxType = "IGST",
}) => {
  const taxableAmount = round2(amountBeforeGST);
  const rate = Number(gstRate);

  if (!Number.isFinite(taxableAmount) || taxableAmount < 0) {
    throw new Error("Invalid taxable amount");
  }

  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error("Invalid GST rate");
  }

  const totalGST = round2((taxableAmount * rate) / 100);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (taxType === "CGST_SGST") {
    cgst = round2(totalGST / 2);
    sgst = round2(totalGST / 2);
  } else {
    igst = totalGST;
  }

  const amountAfterGST = round2(taxableAmount + totalGST);

  return {
    amount_before_gst: taxableAmount,
    gst_rate: rate,
    cgst,
    sgst,
    igst,
    total_gst: totalGST,
    amount_after_gst: amountAfterGST,
  };
};