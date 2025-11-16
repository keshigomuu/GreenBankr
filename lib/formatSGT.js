// lib/formatSGT.js
export function formatSGT(dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
