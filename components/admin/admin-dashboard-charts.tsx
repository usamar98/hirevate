import type {
  ApplicationFunnelStat,
  GrowthTrendPoint,
  PlanStat
} from "@/lib/admin/users";

const chartWidth = 760;
const chartHeight = 220;
const chartPadding = 18;

function buildLinePath(values: number[], maxValue: number) {
  if (values.length === 0) return "";
  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;

  return values
    .map((value, index) => {
      const x = chartPadding + (index / Math.max(values.length - 1, 1)) * usableWidth;
      const y = chartHeight - chartPadding - (value / Math.max(maxValue, 1)) * usableHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function AdminGrowthChart({ points }: { points: GrowthTrendPoint[] }) {
  const maxValue = Math.max(
    ...points.flatMap((point) => [point.signups, point.lastSeen, point.visitors]),
    1
  );
  const signupPath = buildLinePath(points.map((point) => point.signups), maxValue);
  const activePath = buildLinePath(points.map((point) => point.lastSeen), maxValue);
  const visitorPath = buildLinePath(points.map((point) => point.visitors), maxValue);
  const firstDate = points.at(0)?.date ?? "";
  const lastDate = points.at(-1)?.date ?? "";

  return (
    <div>
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink-600">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" />Signups</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Accounts last seen</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Consented visitors</span>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-3">
        <svg
          aria-label="Thirty-day trend for signups, accounts last seen, and consented visitors"
          className="h-auto w-full"
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <title>Thirty-day acquisition and activity trend</title>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              stroke="#e5e7eb"
              strokeDasharray="5 7"
              x1={chartPadding}
              x2={chartWidth - chartPadding}
              y1={chartHeight * ratio}
              y2={chartHeight * ratio}
            />
          ))}
          <path d={visitorPath} fill="none" stroke="#8b5cf6" strokeLinecap="round" strokeWidth="3" />
          <path d={activePath} fill="none" stroke="#10b981" strokeLinecap="round" strokeWidth="3" />
          <path d={signupPath} fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="3" />
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-ink-400">
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

export function AdminApplicationFunnel({ items }: { items: ApplicationFunnelStat[] }) {
  const maxTotal = Math.max(...items.map((item) => item.total), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.status}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-ink-700">{item.label}</span>
            <span className="font-semibold text-ink-900">{item.total}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-violet-500"
              style={{ width: `${item.total ? Math.max(5, (item.total / maxTotal) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPlanDistribution({ items }: { items: PlanStat[] }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const colors: Record<PlanStat["key"], string> = {
    admin: "bg-blue-500",
    annual: "bg-violet-500",
    legacy: "bg-amber-500",
    monthly: "bg-emerald-500",
    none: "bg-gray-300"
  };

  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-gray-100" aria-label="Current plan distribution">
        {items.map((item) => (
          <div
            className={colors[item.key]}
            key={item.key}
            style={{ width: `${total ? (item.total / total) * 100 : 0}%` }}
            title={`${item.label}: ${item.total}`}
          />
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2.5" key={item.key}>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-600">
              <span className={`h-2.5 w-2.5 rounded-full ${colors[item.key]}`} />
              {item.label}
            </span>
            <span className="font-semibold text-ink-900">{item.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
