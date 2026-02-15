 'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ServiceState = {
  name: string;
  url: string;
  ok: boolean;
  code: number | null;
  note: string;
};

async function probe(url: string, note: string, expectJson = false): Promise<ServiceState> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (expectJson) {
      await response.json();
    }
    return {
      name: note,
      url,
      ok: response.ok,
      code: response.status,
      note: response.ok ? 'Live' : 'Reachable but unhealthy',
    };
  } catch {
    return {
      name: note,
      url,
      ok: false,
      code: null,
      note: 'Not reachable',
    };
  }
}

export default function StatusPage() {
  // Internal-only diagnostics page for demo readiness checks.
  // This is intentionally hidden from the main nav and accessed by direct URL.
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');
  const [checks, setChecks] = useState<ServiceState[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const frontendCheck = useMemo<ServiceState>(() => ({
    name: 'Frontend',
    url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    ok: true,
    code: 200,
    note: 'Live (this page is rendering)',
  }), []);

  const runChecks = useCallback(async () => {
    setIsRefreshing(true);
    const results = await Promise.all([
      probe(`${backendBase}/health/`, 'Backend + DB health', true),
      probe(`${backendBase}/api/docs/`, 'API docs'),
      probe(`${apiBase}/analytics/stats/`, 'Public analytics API', true),
    ]);
    setChecks(results);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [apiBase, backendBase]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void runChecks();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, runChecks]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
        <p className="text-gray-600 mt-2">
          Quick live checks for frontend/backend readiness (works for Docker or local runs).
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            Auto-refresh: {autoRefresh ? 'On (5s)' : 'Off'}
          </button>
          <button
            type="button"
            onClick={() => void runChecks()}
            className="px-3 py-1.5 rounded-md text-sm font-medium border border-slate-300 bg-white text-slate-700"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
          <span className="text-xs text-slate-500">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Waiting for first check...'}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {[frontendCheck, ...checks].map((c) => (
            <div
              key={c.name}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500">{c.url}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${c.ok ? 'text-green-600' : 'text-rose-600'}`}>
                  {c.ok ? 'UP' : 'DOWN'}
                </p>
                <p className="text-xs text-gray-500">
                  {c.code ? `HTTP ${c.code}` : 'No response'} · {c.note}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>
            Tip: if these checks are green, your demo stack is ready (whether started via Docker Compose or local scripts).
          </p>
        </div>
      </div>
    </div>
  );
}
