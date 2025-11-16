// lib/donations-api.js

/**
 * Outsystems MakeDonation service
 * Required fields (case-sensitive):
 * {
 *   "CustomerId": "string",
 *   "Cust_Acct_Id": "string",
 *   "Recieving_Acct_Id": "string",
 *   "txnAmt": number,
 *   "Org_ID": number
 * }
 */

/**
 * Build the correct MakeDonation URL in a tolerant way:
 * - If MAKE_DONATION_BASE_URL ends with "/NewDonation", use it as-is
 * - Otherwise, append "/NewDonation"
 * This prevents double-"/NewDonation/NewDonation" and fixes 404.
 */
function getMakeDonationUrl() {
  const raw = process.env.MAKE_DONATION_BASE_URL || "";
  if (!raw) {
    throw new Error("MAKE_DONATION_BASE_URL is not configured");
  }

  // Trim trailing slashes
  const trimmed = raw.replace(/\/+$/, "");

  // If it already ends with /NewDonation (any case), don't append again
  if (/\/NewDonation$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}/NewDonation`;
}

/**
 * Helper for GET donations base URL.
 */
function getDonationsBaseUrl() {
  const raw = process.env.DONATIONS_BASE_URL || "";
  if (!raw) {
    throw new Error("DONATIONS_BASE_URL is not configured");
  }
  return raw.replace(/\/+$/, "");
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
export const DonationsAPI = {
  async addDonation({ customerId, amount, orgId }) {
    const NEW_DONATION_URL = "https://personal-h83kqaoy.outsystemscloud.com/MakeDonation/rest/MakeDonation/NewDonation";
    
    // Pad customerId to 10 digits with leading zeros
    const paddedId = String(customerId).padStart(10, '0');
    
    const payload = {
      CustomerId: paddedId,
      txnAmt: Number(amount),
      Org_ID: Number(orgId),
    };
=======
=======
>>>>>>> Stashed changes
export class DonationsAPI {
  // ============================================================
  // MakeDonation (POST /NewDonation)
  // ============================================================
  static async addDonation({ customerId, amount, orgId, customerDepositAccount }) {
    try {
      // Outsystems requires 10-digit padded customerId
      const paddedId = customerId.toString().padStart(10, "0");
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

      // ✔ CORRECT PAYLOAD FORMAT (Swagger exact)
      const payload = {
        CustomerId: paddedId,
        Cust_Acct_Id: customerDepositAccount, // from logged-in user
        Recieving_Acct_Id: "0000005953",      // fixed receiving account
        txnAmt: Number(amount),
        Org_ID: Number(orgId),
      };

      const url = getMakeDonationUrl();

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        [process.env.MAKE_DONATION_API_KEY_HEADER || "X-Contacts-Key"]:
          process.env.MAKE_DONATION_API_KEY,
      };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("❌ MakeDonation Failed:", res.status, data);
        throw new Error(
          data?.error ||
            data?.message ||
            `NewDonation failed (${res.status})`
        );
      }

      return data; // { txnAmt, transactionId, amount, donationId, ... }
    } catch (err) {
      console.error("❌ addDonation exception:", err);
      throw err;
    }
  }

  // ============================================================
  // Get donations by customer
  // ============================================================
  static async getByCustomer(customerId) {
    const paddedId = customerId.toString().padStart(10, "0");
    const base = getDonationsBaseUrl();

    const url = `${base}/GetDonation?CustomerId=${encodeURIComponent(paddedId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        [process.env.DONATIONS_API_KEY_HEADER || "X-Contacts-Key"]:
          process.env.DONATIONS_API_KEY,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Fetch Donations failed (${res.status})`
      );
    }

    // Support both:
    //  - raw array [ { Customer_ID, Org_ID, Amount, DateOfTxn, ... }, ... ]
    //  - wrapped { donations: [ ... ] }
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.donations)
      ? data.donations
      : [];

    return list.map((d) => ({
      customerId: d.Customer_ID ?? d.customerId ?? paddedId,
      orgId: d.Org_ID ?? d.orgId ?? null,
      amount: d.Amount ?? d.amount ?? 0,
      date: d.DateOfTxn ?? d.date ?? null,
      id: d.Id ?? d.id ?? `${paddedId}-${d.Org_ID ?? d.orgId ?? "org"}-${d.DateOfTxn ?? d.date ?? Date.now()}`,
    }));
  }
}
