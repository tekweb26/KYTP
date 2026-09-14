export const getTaxType = ({
  userGSTState,
  vendorGSTState,
}) => {
  if (!userGSTState || !vendorGSTState) {
    return {
      taxType: "IGST",
      reason: "GST state information is missing",
    };
  }

  const userState = String(userGSTState).trim().toLowerCase();
  const vendorState = String(vendorGSTState).trim().toLowerCase();

  if (userState === vendorState) {
    return {
      taxType: "CGST_SGST",
      reason: "User and vendor are in the same state",
    };
  }

  return {
    taxType: "IGST",
    reason: "User and vendor are in different states",
  };
};