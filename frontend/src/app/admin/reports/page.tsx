'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { moderationService, Report } from '@/services/moderation';
import { Button, Card, CardBody } from '@/components/ui';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  resolved: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Resolved' },
  dismissed: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Dismissed' },
};

const TYPE_LABELS: Record<string, string> = {
  inaccurate: 'Inaccurate Information',
  inappropriate: 'Inappropriate Content',
  spam: 'Spam',
  closed: 'Permanently Closed',
  other: 'Other',
};

interface PendingAction {
  reportId: number;
  resolution: 'resolved' | 'dismissed';
  notes: string;
}

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !['moderator', 'admin'].includes(user.role))) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await moderationService.getReports();
      setReports(data);
    } catch {
      console.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const openAction = (reportId: number, resolution: 'resolved' | 'dismissed') => {
    setPendingAction({ reportId, resolution, notes: '' });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { reportId, resolution, notes } = pendingAction;
    setProcessingId(reportId);
    setPendingAction(null);
    try {
      await moderationService.resolveReport(reportId, resolution, notes.trim() || undefined);
      await loadReports();
      showNotification(
        resolution === 'resolved' ? 'Report resolved' : 'Report dismissed',
        'success',
        4000,
      );
    } catch {
      showNotification('Failed to update report', 'error', 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter);
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Reports</h1>
          <p className="text-gray-600 mt-2">
            {pendingCount} pending report{pendingCount !== 1 ? 's' : ''} from users
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'resolved', 'dismissed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? `All (${reports.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${reports.filter((r) => r.status === f).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500 py-8">
                {filter === 'all' ? 'No reports have been submitted yet.' : `No ${filter} reports.`}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => {
              const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.pending;
              const borderColor =
                report.status === 'pending'
                  ? 'border-l-amber-400 bg-amber-50/30'
                  : report.status === 'resolved'
                    ? 'border-l-emerald-500 bg-emerald-50/30'
                    : 'border-l-gray-400 bg-gray-50/50';

              return (
                <div
                  key={report.id}
                  className={`rounded-xl border border-gray-200 border-l-4 ${borderColor} px-5 py-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {TYPE_LABELS[report.reportType] || report.reportType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{report.reporterUsername}</span> reported{' '}
                        <Link href={`/assets/${report.assetSlug}`} className="text-primary-600 hover:underline font-medium">
                          {report.assetTitle}
                        </Link>
                      </p>

                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1">&ldquo;{report.description}&rdquo;</p>
                      )}
                    </div>

                    {report.status === 'pending' && pendingAction?.reportId !== report.id && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => openAction(report.id, 'resolved')}
                          loading={processingId === report.id}
                          disabled={processingId !== null}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAction(report.id, 'dismissed')}
                          disabled={processingId !== null}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>

                  {pendingAction?.reportId === report.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        {pendingAction.resolution === 'resolved' ? 'Resolution' : 'Dismissal'} note{' '}
                        <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        value={pendingAction.notes}
                        onChange={(e) => setPendingAction((prev) => prev ? { ...prev, notes: e.target.value } : prev)}
                        rows={2}
                        placeholder="e.g. Verified with owner — content corrected."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => void handleConfirmAction()}>
                          Confirm {pendingAction.resolution === 'resolved' ? 'Resolve' : 'Dismiss'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
