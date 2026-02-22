'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { moderationService, AdminAnalytics } from '@/services/moderation';

function ColumnChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-gray-400">No data.</p>;

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const PAD = { top: 16, right: 12, bottom: 32, left: 30 };
  const W = 560;
  const H = 180;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const baseY = PAD.top + plotH;
  const slotW = plotW / data.length;
  const barW = Math.max(4, slotW * 0.6);

  const step = maxVal <= 3 ? 1 : maxVal <= 8 ? 2 : maxVal <= 20 ? 5 : 10;
  const gridLabels: number[] = [];
  for (let v = 0; v <= maxVal; v += step) gridLabels.push(v);
  if (gridLabels[gridLabels.length - 1] < maxVal) gridLabels.push(maxVal);

  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      <defs>
        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {gridLabels.map((v) => {
        const y = baseY - (v / maxVal) * plotH;
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth="0.6" />
            <text x={PAD.left - 6} y={y + 3.5} textAnchor="end" fontSize="9" className="fill-gray-400 select-none">
              {v}
            </text>
          </g>
        );
      })}

      <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY} stroke="#d1d5db" strokeWidth="0.8" />

      {data.map((d, i) => {
        const x = PAD.left + i * slotW + (slotW - barW) / 2;
        const h = d.value > 0 ? Math.max(3, (d.value / maxVal) * plotH) : 0;
        const y = baseY - h;
        return (
          <g key={i}>
            {d.value > 0 && (
              <rect x={x} y={y} width={barW} height={h} rx={2} fill="url(#colGrad)" className="opacity-90 hover:opacity-100 transition-opacity" />
            )}
            {i % labelEvery === 0 && (
              <text x={PAD.left + i * slotW + slotW / 2} y={H - 8} textAnchor="middle" fontSize="8" className="fill-gray-400 select-none">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({
  segments,
  size = 130,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, i) => s + i.value, 0) || 1;
  const r = 44;
  const cx = 55;
  const cy = 55;
  const sw = 12;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 110 110" className="shrink-0 drop-shadow-sm">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="17" fontWeight="700" className="fill-gray-800">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" className="fill-gray-400">
          total
        </text>
      </svg>
      <ul className="space-y-2 text-[13px]">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-gray-900">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HBarChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600 font-medium">{item.label}</span>
            <span className="font-bold tabular-nums text-gray-900">{item.value}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color}`}
              style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value > 0 ? 6 : 0, transition: 'width 0.6s ease' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-extrabold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['moderator', 'admin'].includes(user.role))) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    moderationService
      .getAdminAnalytics()
      .then(setData)
      .catch((err) => console.error('Failed to load admin analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading dashboard&hellip;</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  const totalAssets =
    data.assetsByStatus.pending + data.assetsByStatus.approved + data.assetsByStatus.rejected;
  const totalDecisions =
    data.moderationSummary.approved + data.moderationSummary.rejected + data.moderationSummary.requestedChanges;

  const daily = (data.dailySubmissions ?? []).slice().reverse();
  const trendBars = daily.map((d) => {
    const dt = new Date(d.date);
    return { label: `${dt.getDate()}/${dt.getMonth() + 1}`, value: d.count };
  });

  const totalSubmissions30d = daily.reduce((s, d) => s + d.count, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Moderation analytics &amp; contribution activity for the Devon Community Tourist Assistant.
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            &larr; Moderation queue
          </Link>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard label="Pending review" value={data.assetsByStatus.pending} accent="text-amber-600" />
          <KpiCard label="Approved" value={data.assetsByStatus.approved} accent="text-emerald-600" />
          <KpiCard label="Rejected" value={data.assetsByStatus.rejected} accent="text-rose-600" />
          <KpiCard label="Decisions made" value={totalDecisions} accent="text-blue-600" />
          <KpiCard label="Total assets" value={totalAssets} accent="text-gray-800" />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <Panel title="Asset status">
            <DonutChart
              segments={[
                { label: 'Approved', value: data.assetsByStatus.approved, color: '#10b981' },
                { label: 'Pending', value: data.assetsByStatus.pending, color: '#f59e0b' },
                { label: 'Rejected', value: data.assetsByStatus.rejected, color: '#ef4444' },
              ]}
            />
          </Panel>

          <Panel title="Moderation decisions">
            <DonutChart
              segments={[
                { label: 'Approved', value: data.moderationSummary.approved, color: '#10b981' },
                { label: 'Rejected', value: data.moderationSummary.rejected, color: '#ef4444' },
                { label: 'Changes req.', value: data.moderationSummary.requestedChanges, color: '#3b82f6' },
              ]}
            />
          </Panel>

          <Panel title="Decision volume">
            <HBarChart
              items={[
                { label: 'Approved', value: data.moderationSummary.approved, color: 'bg-emerald-500' },
                { label: 'Rejected', value: data.moderationSummary.rejected, color: 'bg-rose-500' },
                { label: 'Changes req.', value: data.moderationSummary.requestedChanges, color: 'bg-blue-500' },
              ]}
            />
          </Panel>

          <Panel title="Asset status volume">
            <HBarChart
              items={[
                { label: 'Approved', value: data.assetsByStatus.approved, color: 'bg-emerald-500' },
                { label: 'Pending', value: data.assetsByStatus.pending, color: 'bg-amber-500' },
                { label: 'Rejected', value: data.assetsByStatus.rejected, color: 'bg-rose-500' },
              ]}
            />
          </Panel>
        </div>

        <div className="grid lg:grid-cols-5 gap-5 mb-6">
          <Panel title="30-day submission trend" className="lg:col-span-3">
            <div className="flex items-baseline gap-3 mb-3 -mt-2">
              <span className="text-2xl font-extrabold text-gray-800 tabular-nums">{totalSubmissions30d}</span>
              <span className="text-sm text-gray-400">submissions in the last 30 days</span>
            </div>
            <ColumnChart data={trendBars} />
          </Panel>

          <Panel title="Assets by category" className="lg:col-span-2">
            {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <HBarChart
                items={data.categoryBreakdown.slice(0, 7).map((c, i) => ({
                  label: c.name,
                  value: c.approved,
                  color: [
                    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500',
                    'bg-rose-500', 'bg-cyan-500', 'bg-orange-500',
                  ][i % 7],
                }))}
              />
            ) : (
              <p className="text-sm text-gray-400">No category data yet.</p>
            )}
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Panel title="Top contributors">
            {data.topContributors && data.topContributors.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {data.topContributors.slice(0, 8).map((u, i) => (
                  <div key={u.username} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{u.username}</span>
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      <span className="font-semibold text-gray-800">{u.contributionCount}</span>
                      <span className="mx-0.5">sub</span>
                      <span className="text-gray-300 mx-1">|</span>
                      <span className="font-semibold text-gray-800">{u.points}</span>
                      <span className="mx-0.5">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No contributor data yet.</p>
            )}
          </Panel>

          <Panel title="Category details">
            {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {data.categoryBreakdown.slice(0, 8).map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    <div className="text-xs text-gray-500 tabular-nums">
                      <span className="font-semibold text-gray-800">{c.approved}</span>
                      <span className="mx-0.5">approved</span>
                      <span className="text-gray-300 mx-1">|</span>
                      <span className="font-semibold text-gray-800">{Number(c.avgRating ?? 0).toFixed(1)}</span>
                      <span className="ml-0.5">★</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No category data yet.</p>
            )}
          </Panel>
        </div>

        <p className="text-center text-xs text-gray-300 mt-10 mb-2">
          Data computed live from the database on each page load.
        </p>
      </div>
    </div>
  );
}
