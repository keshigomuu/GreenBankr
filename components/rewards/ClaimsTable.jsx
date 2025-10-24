"use client";

export default function ClaimsTable({ claims = [] }) {
  if (!claims.length) {
    return (
      <div className="p-6 text-sm text-muted-foreground border rounded-lg">
        You haven’t claimed any rewards yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3">Item</th>
            <th className="text-left p-3">Points</th>
            <th className="text-left p-3">Claim Date</th>
            <th className="text-left p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.claimId} className="border-t">
              <td className="p-3">{c.item}</td>
              <td className="p-3">{c.pointsCost}</td>
              <td className="p-3">{c.claimDate || "-"}</td>
              <td className="p-3">{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
