import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Runtime guard
export const isBrowser = typeof window !== "undefined";

const KEY_STR = "customerId";     // existing string id (e.g., "user_abcd1234")
const KEY_INT = "customerIdInt";  // new numeric id for services that require integers

export function getCustomerId() {
  if (!isBrowser) return null;
  return window.localStorage.getItem(KEY_STR);
}

export function setCustomerId(id) {
  if (!isBrowser) return;
  window.localStorage.setItem(KEY_STR, id);
}

/**
 * Deterministic, stable numeric id derived from a string.
 * djb2-ish hash -> 9-digit positive integer (1..999,999,999)
 */
function deriveNumericIdFromString(s) {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i); // hash*33 + char
    hash |= 0; // 32-bit
  }
  let n = Math.abs(hash);
  // Compress to 9 digits to be safe for APIs expecting "int"
  n = (n % 999_999_999) || 1;
  return n;
}

export function getNumericCustomerId() {
  if (!isBrowser) return null;
  const v = window.localStorage.getItem(KEY_INT);
  return v ? parseInt(v, 10) : null;
}

export function setNumericCustomerId(n) {
  if (!isBrowser) return;
  window.localStorage.setItem(KEY_INT, String(n));
}

/**
 * Ensure both string and numeric ids exist and return them.
 * - Keeps your existing string id behavior for Rewards/Loyalty.
 * - Adds a stable numeric id for Donations or any API that requires an integer.
 */
export function ensureCustomerIds() {
  if (!isBrowser) return { id: null, intId: null };

  let id = getCustomerId();
  if (!id) {
    id = `user_${Math.random().toString(36).slice(2, 10)}`;
    setCustomerId(id);
  }

  let intId = getNumericCustomerId();
  if (!Number.isInteger(intId) || intId <= 0) {
    intId = deriveNumericIdFromString(id);
    setNumericCustomerId(intId);
  }

  return { id, intId };
}

/** Backwards-compat convenience used in existing pages */
export function ensureCustomerId() {
  return ensureCustomerIds().id;
}

/** New: always returns a numeric id (browser only) */
export function ensureNumericCustomerId() {
  return ensureCustomerIds().intId;
}
