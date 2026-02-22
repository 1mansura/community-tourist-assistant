'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import {
  moderationService,
  ModerationHistoryItem,
  PendingAsset,
  PendingAssetImage,
  AdminAnalytics,
  ModerationUser,
  Report,
} from '@/services/moderation';
import { Button, Card, CardBody, CardHeader } from '@/components/ui';
import { mediaUrl } from '@/lib/mediaUrl';

const REPORT_TYPE_LABELS: Record<string, string> = {
  inaccurate: 'Inaccurate Information',
  inappropriate: 'Inappropriate Content',
  spam: 'Spam',
  closed: 'Permanently Closed',
  other: 'Other',
};

export default function ModerationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  
  const [queue, setQueue] = useState<PendingAsset[]>([]);
  const [history, setHistory] = useState<ModerationHistoryItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<ModerationUser[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [decisionAction, setDecisionAction] = useState<'reject' | 'request_changes'>('reject');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [userAction, setUserAction] = useState<'suspend' | 'ban' | 'reactivate'>('suspend');
  const [userActionReason, setUserActionReason] = useState('');
  const [userActionTarget, setUserActionTarget] = useState<ModerationUser | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingReportId, setProcessingReportId] = useState<number | null>(null);
  
  useEffect(() => {
    if (!authLoading && (!user || !['moderator', 'admin'].includes(user.role))) {
      router.push('/');
    }
  }, [authLoading, user, router]);
  
  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      moderationService
        .getUsers(userQuery)
        .then(setUsers)
        .catch((error) => console.error('Failed to load moderation users:', error));
    }, 250);
    return () => clearTimeout(id);
  }, [userQuery]);
  
  const loadQueue = async () => {
    try {
      const [queueData, historyData, reportsData] = await Promise.all([
        moderationService.getQueue(),
        moderationService.getHistory(),
        moderationService.getReports(),
      ]);
      const usersData = await moderationService.getUsers();
      const analyticsData = await moderationService.getAdminAnalytics();
      setQueue(queueData);
      setHistory(historyData);
      setReports(reportsData);
      setUsers(usersData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async (reportId: number, resolution: 'resolved' | 'dismissed') => {
    setProcessingReportId(reportId);
    try {
      await moderationService.resolveReport(reportId, resolution);
      await loadQueue();
      showNotification(
        resolution === 'resolved' ? 'Report resolved' : 'Report dismissed',
        'success',
        4000,
      );
    } catch {
      showNotification('Failed to update report', 'error', 5000);
    } finally {
      setProcessingReportId(null);
    }
  };
  
  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await moderationService.decide(id, 'approve');
      await loadQueue();
      showNotification('Submission approved', 'success', 4000, 'Queue and dashboard metrics were refreshed.');
    } catch (error) {
      console.error('Failed to approve:', error);
      showNotification('Approval failed', 'error', 5000, 'Please try again.');
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await moderationService.decide(id, decisionAction, rejectReason);
      if (decisionAction === 'reject') {
        setQueue((prev) => prev.filter((item) => item.id !== id));
      }
      await loadQueue();
      setShowRejectModal(null);
      setRejectReason('');
      showNotification(
        decisionAction === 'request_changes' ? 'Change request sent' : 'Submission rejected',
        'info',
        4500,
        'Queue and history were refreshed.',
      );
    } catch (error) {
      console.error('Failed to reject:', error);
      showNotification('Action failed', 'error', 5000, 'Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUserAction = async () => {
    if (!userActionTarget) return;
    setProcessingUserId(userActionTarget.id);
    try {
      await moderationService.setUserStatus(userActionTarget.id, userAction, userActionReason);
      await loadQueue();
      setUserActionTarget(null);
      setUserActionReason('');
      const actionText =
        userAction === 'suspend' ? 'suspended' : userAction === 'ban' ? 'banned' : 'reactivated';
      showNotification(
        `User ${actionText}`,
        'success',
        4000,
        'User status and moderation data were refreshed.',
      );
    } catch (error) {
      console.error('Failed user moderation action:', error);
      showNotification('User action failed', 'error', 5000, 'Please try again.');
    } finally {
      setProcessingUserId(null);
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Moderation Queue</h1>
          <p className="text-gray-600 mt-2">
            {queue.length} submission{queue.length !== 1 ? 's' : ''} pending review
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Admin and moderators can approve/reject/request changes directly here.
          </p>
          <div className="mt-3">
            <Link href="/admin/analytics" className="text-sm text-primary-600 hover:underline">
              Open moderation dashboard
            </Link>
          </div>
        </div>

        {analytics && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-8">
            <Card>
              <CardBody>
                <p className="text-xs text-gray-500">Pending queue</p>
                <p className="text-2xl font-bold text-amber-600">{analytics.assetsByStatus.pending}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-500">Approved assets</p>
                <p className="text-2xl font-bold text-green-600">{analytics.assetsByStatus.approved}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-500">Rejected assets</p>
                <p className="text-2xl font-bold text-rose-600">{analytics.assetsByStatus.rejected}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-500">Approvals (actions)</p>
                <p className="text-2xl font-bold text-emerald-600">{analytics.moderationSummary.approved}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-500">Change requests</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.moderationSummary.requestedChanges}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-500">Rejections (actions)</p>
                <p className="text-2xl font-bold text-rose-600">{analytics.moderationSummary.rejected}</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* FR-11: reports are a separate API from submission queue, but appear on the same staff hub */}
        <div className="mb-10">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Content reports</h2>
              <p className="text-gray-600 mt-1 text-sm">
                User flags on published places (not the same list as new submissions above). Full inbox:{' '}
                <Link href="/admin/reports" className="text-primary-600 hover:underline font-medium">
                  Reports
                </Link>
                .
              </p>
            </div>
            <span className="text-sm font-medium text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {reports.filter((r) => r.status === 'pending').length} pending
            </span>
          </div>
          {reports.filter((r) => r.status === 'pending').length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-center text-gray-500 py-6 text-sm">No open reports.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports
                .filter((r) => r.status === 'pending')
                .slice(0, 8)
                .map((r) => (
                  <Card key={r.id}>
                    <CardBody>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                            {REPORT_TYPE_LABELS[r.reportType] || r.reportType}
                          </p>
                          <p className="text-sm text-gray-900 mt-1">
                            <Link
                              href={`/assets/${r.assetSlug}`}
                              className="text-primary-600 hover:underline font-medium"
                            >
                              {r.assetTitle || `Asset #${r.asset}`}
                            </Link>
                            <span className="text-gray-500"> · by {r.reporterUsername || 'user'}</span>
                          </p>
                          {r.description ? (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.description}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleResolveReport(r.id, 'resolved')}
                            loading={processingReportId === r.id}
                            disabled={processingReportId !== null}
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            loading={processingReportId === r.id}
                            disabled={processingReportId !== null}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {queue.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500 py-8">
                No pending submissions. Great work!
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        {item.categoryName} | Submitted by {item.submittedByUsername || 'Unknown'}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-700 mb-4">{item.description}</p>

                  {item.images && item.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Submitted images ({item.images.length})
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {item.images.map((img: PendingAssetImage) => (
                          <a
                            key={img.id}
                            href={mediaUrl(img.image)}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 group"
                          >
                            <img
                              src={mediaUrl(img.image)}
                              alt={img.caption || 'Submitted image'}
                              loading="lazy"
                              className="w-28 h-20 rounded-lg object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                            />
                            {img.caption && (
                              <p className="text-[10px] text-gray-400 mt-1 max-w-[112px] truncate">{img.caption}</p>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-3">
                    Location: {item.address || item.postcode || 'Pinned on map'}
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                    className="text-sm text-primary-600 hover:text-primary-700 mb-4"
                  >
                    {expandedId === item.id ? 'Hide details' : 'View details'}
                  </button>

                  {expandedId === item.id && (
                    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                      {item.address && <p><span className="font-medium">Address:</span> {item.address}</p>}
                      {item.postcode && <p><span className="font-medium">Postcode:</span> {item.postcode}</p>}
                      {item.website && (
                        <p>
                          <span className="font-medium">Website:</span>{' '}
                          <a href={item.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                            {item.website}
                          </a>
                        </p>
                      )}
                      {item.phone && <p><span className="font-medium">Phone:</span> {item.phone}</p>}
                      {item.openingHours && Object.keys(item.openingHours).length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Opening hours:</p>
                          <ul className="space-y-1">
                            {Object.entries(item.openingHours).map(([day, hours]) => (
                              <li key={day}>
                                <span className="capitalize">{day}</span>: {String(hours)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(item.id)}
                      loading={processingId === item.id}
                      disabled={processingId !== null}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDecisionAction('request_changes');
                        setShowRejectModal(item.id);
                      }}
                      disabled={processingId !== null}
                    >
                      Request changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDecisionAction('reject');
                        setShowRejectModal(item.id);
                      }}
                      disabled={processingId !== null}
                    >
                      Reject
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">Recent moderation history</h2>
          <p className="text-gray-600 mt-1">Latest approvals, rejections, and change requests.</p>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No moderation actions recorded yet.
              </div>
            ) : (
              history.slice(0, 20).map((entry) => {
                const borderColor =
                  entry.action === 'approve'
                    ? 'border-l-emerald-500 bg-emerald-50/40'
                    : entry.action === 'reject'
                      ? 'border-l-red-500 bg-red-50/40'
                      : 'border-l-amber-400 bg-amber-50/40';
                const badge =
                  entry.action === 'approve'
                    ? 'bg-emerald-100 text-emerald-800'
                    : entry.action === 'reject'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800';
                const label =
                  entry.action === 'approve' ? 'Approved' : entry.action === 'reject' ? 'Rejected' : 'Changes requested';

                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl border border-gray-200 border-l-4 ${borderColor} px-5 py-4`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                            {label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1.5">
                          <span className="font-semibold">{entry.moderatorUsername || 'Unknown'}</span>
                          {' — '}
                          {entry.action === 'approve' ? (
                            <Link href={`/assets/${entry.assetSlug}`} className="text-primary-600 hover:underline font-medium">
                              {entry.assetTitle}
                            </Link>
                          ) : (
                            <span className="font-medium">{entry.assetTitle}</span>
                          )}
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            Reason: {entry.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">User moderation controls</h2>
          <p className="text-gray-600 mt-1">Account safety actions for abusive users (suspend, ban, reactivate).</p>
          <div className="mt-4 mb-4">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users by username/email"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="space-y-3">
            {users.slice(0, 12).map((u) => (
              <Card key={u.id}>
                <CardBody>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{u.username} <span className="text-xs text-gray-500">({u.role})</span></p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Points: {u.points} · Contributions: {u.contributionCount} · Status: {u.isActive ? 'Active' : 'Suspended/Banned'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {u.isActive ? (
                        <>
                          <Button
                            variant="outline"
                            disabled={processingUserId !== null}
                            onClick={() => {
                              setUserAction('suspend');
                              setUserActionTarget(u);
                            }}
                          >
                            Suspend
                          </Button>
                          <Button
                            variant="outline"
                            disabled={processingUserId !== null}
                            onClick={() => {
                              setUserAction('ban');
                              setUserActionTarget(u);
                            }}
                          >
                            Ban
                          </Button>
                        </>
                      ) : (
                        <Button
                          disabled={processingUserId !== null}
                          onClick={() => {
                            setUserAction('reactivate');
                            setUserActionTarget(u);
                          }}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
            {users.length === 0 && (
              <Card>
                <CardBody>
                  <p className="text-sm text-gray-500">No users matched your search.</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
        
        {showRejectModal !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {decisionAction === 'request_changes' ? 'Request changes' : 'Reject submission'}
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={
                  decisionAction === 'request_changes'
                    ? 'Tell the contributor what to improve'
                    : 'Reason for rejection (optional)'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                rows={3}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowRejectModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReject(showRejectModal)}
                  loading={processingId === showRejectModal}
                >
                  {decisionAction === 'request_changes' ? 'Send change request' : 'Confirm rejection'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {userActionTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {userAction} user
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Target: <span className="font-medium">{userActionTarget.username}</span> ({userActionTarget.email})
              </p>
              <textarea
                value={userActionReason}
                onChange={(e) => setUserActionReason(e.target.value)}
                placeholder="Reason (recommended)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                rows={3}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setUserActionTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUserAction} loading={processingUserId === userActionTarget.id}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
