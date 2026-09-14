const SANDBOX_BASE_URL = "https://test-api.sandbox.co.in";

export const getGSTStatus = async (gstin) => {
  if (!gstin) {
    throw new Error("GSTIN is required");
  }

  // 1. Authenticate with Sandbox
  const authResponse = await fetch(
    `${SANDBOX_BASE_URL}/authenticate`,
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.GST_API_KEY,
        "x-api-secret": process.env.GST_API_SECRET,
        "x-api-version": "1.0.0",
        "Content-Type": "application/json",
      },
    }
  );

  const authData = await authResponse.json();

  if (!authResponse.ok) {
    throw new Error(
      authData.message || "Sandbox authentication failed"
    );
  }

  const accessToken = authData.data.access_token;

  // 2. Search GSTIN
  const gstResponse = await fetch(
    `${SANDBOX_BASE_URL}/gst/compliance/public/gstin/search`,
    {
      method: "POST",
      headers: {
        authorization: accessToken,
        "x-api-key": process.env.GST_API_KEY,
        "x-api-version": "1.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gstin: gstin.trim().toUpperCase(),
      }),
    }
  );

  const gstData = await gstResponse.json();

  if (!gstResponse.ok) {
    throw new Error(
      gstData.message || "GSTIN search failed"
    );
  }

  const data = gstData.data?.data;

  if (!data) {
    throw new Error("GSTIN data not found");
  }

  // 3. Return required GST fields
  return {
    gstn: data.gstin,
    legal_name_of_business: data.lgnm,
    central_jurisdiction: data.ctj,
    state_jurisdiction: data.stj,
    date_of_registration: data.rgdt,
    constitution_of_business: data.ctb,
    taxpayer_type: data.dty,
    gstn_status: data.sts,
    nature_of_business_activity: data.nba,

    // Vendor state - will be used later for GST tax type
    vendor_state: data.pradr?.addr?.stcd || null,
  };
};