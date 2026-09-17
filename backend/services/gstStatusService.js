const SANDBOX_BASE_URL =
  process.env.GST_ENV === "production"
    ? "https://api.sandbox.co.in"
    : "https://test-api.sandbox.co.in";

export const getGSTStatus = async (gstin) => {
  if (!gstin) {
    throw new Error("GSTIN is required");
  }

  const requestedGSTIN = gstin
    .trim()
    .toUpperCase();

  console.log("GST Environment:", process.env.GST_ENV);
  console.log("GST API URL:", SANDBOX_BASE_URL);
  console.log("GSTIN sent to Sandbox:", requestedGSTIN);

  // ==========================================
  // 1. AUTHENTICATION
  // ==========================================

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
    console.error(
      "GST Authentication Error:",
      authData
    );

    throw new Error(
      authData.message ||
      "Sandbox authentication failed"
    );
  }

  const accessToken =
    authData.data?.access_token;

  if (!accessToken) {
    throw new Error(
      "GST access token was not received"
    );
  }

  // ==========================================
  // 2. GSTIN SEARCH
  // ==========================================

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
        gstin: requestedGSTIN,
      }),
    }
  );

  const gstData = await gstResponse.json();

  console.log(
    "GST API RAW RESPONSE:",
    JSON.stringify(gstData, null, 2)
  );

  if (!gstResponse.ok) {
    throw new Error(
      gstData.message ||
      "GSTIN search failed"
    );
  }

  const data =
    gstData.data?.data;

  if (!data) {
    throw new Error(
      "GSTIN data not found"
    );
  }

  // ==========================================
  // 3. RETURN CLEAN RESPONSE TO FRONTEND
  // ==========================================

  return {
    verified: data.sts === "Active",
    gstin:
      data.gstin ||
      requestedGSTIN,

    legal_name_of_business:
      data.lgnm || null,

    trade_name:
      data.tradeNam || null,

    central_jurisdiction:
      data.ctj || null,

    state_jurisdiction:
      data.stj || null,

    date_of_registration:
      data.rgdt || null,

    constitution_of_business:
      data.ctb || null,

    taxpayer_type:
      data.dty || null,

    gstn_status:
      data.sts || null,

    nature_of_business_activity:
      data.nba || [],

    vendor_state:
      data.pradr?.addr?.stcd || null,

    transaction_id:
      gstData.transaction_id || null,
  };
};