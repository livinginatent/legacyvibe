import DodoPayments from "dodopayments";

// Lazy initialization to avoid build-time errors
let _dodo: DodoPayments | null = null;

export function getDodo(): DodoPayments {
  if (!_dodo) {
    if (!process.env.DODO_PAYMENTS_API_KEY) {
      throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
    }

    // Determine environment mode
    // Set DODO_LIVE_MODE=true in production when ready to go live
    const isLiveMode = process.env.DODO_LIVE_MODE === "true";
    const environment = isLiveMode ? "live_mode" : "test_mode";

    console.log(`[Dodo] Initializing in ${environment}`);

    _dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment,
    });
  }

  return _dodo;
}

// Product ID for the LegacyVibe one-time payment
export const LEGACYVIBE_PRODUCT_ID = process.env.DODO_PAYMENTS_PRODUCT_ID || "";
