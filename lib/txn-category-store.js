// lib/txn-category-store.js

// Simple in-memory store: transactionId -> MerchantCategory
// Note: resets when the server restarts (OK for school project/demo).
export const txnCategoryStore = new Map();
