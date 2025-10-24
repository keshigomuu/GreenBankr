"use client";
export default function Error({ error, reset }) {
  return (
    <div className="p-6">
      <p className="text-red-600 font-medium">Something went wrong.</p>
      <pre className="text-xs mt-2">{String(error?.message || error)}</pre>
      <button className="mt-4 underline" onClick={() => reset?.()}>Try again</button>
    </div>
  );
}
