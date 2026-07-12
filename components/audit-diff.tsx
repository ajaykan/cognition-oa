function parse(json: string | null): Record<string, unknown> | null {
  if (json == null) return null;
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" ? (value as Record<string, unknown>) : { value };
  } catch {
    return { value: json };
  }
}

function display(v: unknown): string {
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// Renders a key-by-key before/after comparison, highlighting changed fields.
export function BeforeAfterDiff({
  before,
  after,
}: {
  before: string | null;
  after: string | null;
}) {
  const b = parse(before);
  const a = parse(after);
  const keys = Array.from(
    new Set([...(b ? Object.keys(b) : []), ...(a ? Object.keys(a) : [])]),
  );

  if (keys.length === 0) {
    return <div className="text-xs text-slate-400">No state snapshot recorded.</div>;
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-slate-400">
          <th className="py-1 pr-4 font-medium">Field</th>
          <th className="py-1 pr-4 font-medium">Before</th>
          <th className="py-1 font-medium">After</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => {
          const bv = b ? b[key] : undefined;
          const av = a ? a[key] : undefined;
          const changed = display(bv) !== display(av);
          return (
            <tr key={key} className={changed ? "bg-amber-50" : ""}>
              <td className="py-1 pr-4 align-top font-medium text-slate-600">{key}</td>
              <td className="py-1 pr-4 align-top font-mono text-slate-500">
                {display(bv)}
              </td>
              <td className="py-1 align-top font-mono text-slate-900">
                {display(av)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
