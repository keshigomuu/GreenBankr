// lib/customer-onboarding-api.js

// Use the correct environment variable name that matches your .env.local
const BASE_URL = process.env.CUSTOMER_ONBOARD_BASE_URL;
const API_KEY = process.env.CUSTOMER_ONBOARD_API_KEY;
const API_KEY_HEADER = process.env.CUSTOMER_ONBOARD_API_KEY_HEADER || "X-Contacts-Key";

function assertConfig() {
  console.log("Customer Onboarding API Configuration:");
  console.log("- BASE_URL:", BASE_URL);
  console.log(
    "- API_KEY:",
    API_KEY ? API_KEY.substring(0, 8) + "..." + API_KEY.slice(-4) : "(missing)"
  );
  console.log("- API_KEY_HEADER:", API_KEY_HEADER);

  if (!BASE_URL) {
    throw new Error("Missing CUSTOMER_ONBOARD_BASE_URL in environment variables");
  }
  if (!API_KEY) {
    throw new Error("Missing CUSTOMER_ONBOARD_API_KEY in environment variables");
  }
}

function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (API_KEY) {
    headers[API_KEY_HEADER] = API_KEY;
  }

  console.log("Request headers:", {
    "Content-Type": headers["Content-Type"],
    [API_KEY_HEADER]: headers[API_KEY_HEADER]
      ? headers[API_KEY_HEADER].substring(0, 8) + "..."
      : "(none)",
  });

  return headers;
}

/**
 * Creates a customer using the Customer Onboarding service.
 * tenantId and customerType are HARD-CODED (600 and 100) and cannot be changed by the frontend.
 */
export async function createCustomer(formData) {
  assertConfig();

  console.log("=== CUSTOMER CREATION API CALL ===");

  // Build payload exactly as composite service expects
  const payload = {
    // Strings
    icNumber: String(formData.icNumber || ""),
    familyName: String(formData.familyName || ""),
    givenName: String(formData.givenName || ""),
    dateOfBirth: String(formData.dateOfBirth || "2014-12-31"),
    gender: String(formData.gender || ""),
    emailAddress: String(formData.emailAddress || ""),
    countryCode: String(formData.countryCode || ""),
    mobileNumber: String(formData.mobileNumber || ""),
    phoneCountryCode: String(formData.phoneCountryCode || ""),
    preferredUserld: String(formData.preferredUserld || ""), // NOTE: lowercase "l"
    currency: String(formData.currency || ""),
    password: String(formData.password || ""),

    // Numbers
    annualSalary: Number(formData.annualSalary) || 15000,

    // Booleans
    Preference: Boolean(formData.Preference),

    // Donation preferences
    DonationOrg: String(formData.DonationOrg || ""),

    // 🔒 HARD-CODED REQUIRED CONSTANTS
    tenantId: "600",
    customerType: "100",
  };

  // Required field validation (tenantId / customerType are always present because they are hard-coded)
  if (
    !payload.icNumber ||
    !payload.familyName ||
    !payload.givenName ||
    !payload.emailAddress ||
    !payload.mobileNumber ||
    !payload.preferredUserld ||
    !payload.password
  ) {
    throw new Error("Missing required fields for customer creation");
  }

  console.log("EXACT PAYLOAD being sent:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const requestBody = JSON.stringify(payload);
    console.log("JSON string length:", requestBody.length);

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: getHeaders(),
      body: requestBody,
    });

    console.log("Response status:", response.status, response.statusText);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("Raw response text:", responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Failed to parse response JSON:", parseError);
      console.error("Raw response was:", responseText);
      throw new Error(`Invalid response format: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error(" API ERROR DETAILS:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      const errorMsg =
        data?.Errors?.join(", ") ||
        data?.error ||
        data?.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    console.log("Customer creation successful!");
    console.log("Response data:", data);
    return data;
  } catch (error) {
    console.error("Customer creation failed:", error);
    throw error;
  }
}
