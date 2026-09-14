export const getGSTDetails = async (gstin) => {
  if (!gstin) {
    throw new Error("GSTIN is required");
  }

  // GST API integration इथे येईल
  // API URL आणि authentication details मिळाल्यावर
  // आपण हा भाग complete करू.

  return {
    gstin,
    legal_name_of_business: null,
    central_jurisdiction: null,
    state_jurisdiction: null,
    date_of_registration: null,
    constitution_of_business: null,
    taxpayer_type: null,
    gstin_status: null,
    nature_of_business_activity: null,
  };
};