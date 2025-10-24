import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Runtime guards
export const isBrowser = typeof window !== "undefined";

const KEY = "customerId";

export function getCustomerId() {
  if (!isBrowser) return null; // SSR/Route handlers
  return window.localStorage.getItem(KEY);
}

export function setCustomerId(id) {
  if (!isBrowser) return;
  window.localStorage.setItem(KEY, id);
}

export function ensureCustomerId() {
  if (!isBrowser) return null;
  let id = getCustomerId();
  if (!id) {
    id = `user_${Math.random().toString(36).slice(2, 10)}`;
    setCustomerId(id);
  }
  return id;
}
