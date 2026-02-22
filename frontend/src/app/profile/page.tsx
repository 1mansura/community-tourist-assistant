'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { reviewsService } from '@/services/reviews';
import { assetsService } from '@/services/assets';
import { moderationService, AdminAnalytics } from '@/services/moderation';
import { recordSubmissionStatusSnapshot } from '@/lib/submissionNotifications';
import type { Review } from '@/types';
import type { AssetWithStatus } from '@/types';
import type { User } from '@/types';

const badgeIcons: Record<string, string> = {
  rocket: '🚀',
  star: '⭐',
  trophy: '🏆',
  pen: '✏️',
  book: '📚',
  'thumbs-up': '👍',
  camera: '📷',
  clock: '⏰',
  badge: '🎖️',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [mySubmissions, setMySubmissions] = useState<AssetWithStatus[]>([]);
  const [adminStats, setAdminStats] = useState<AdminAnalytics | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Always use the freshest available user, falling back to authUser
  const displayUser = user ?? authUser;

  const isStaff = displayUser?.role && ['moderator', 'admin'].includes(displayUser.role);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  // Always fetch fresh user profile to ensure points/contributionCount are up-to-date
  useEffect(() => {
    if (!isAuthenticated) return;
    authService.getProfile().then((profile) => {
      setUser(profile);
      refreshUser(); // sync AuthContext too
    }).catch(() => {
      // fallback to AuthContext user
      setUser(authUser);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // intentionally only re-run on auth state change, not on refreshUser

  useEffect(() => {
    if (!isAuthenticated || !displayUser) return;
    const promises: Promise<unknown>[] = [
      reviewsService.getMyReviews(),
      assetsService.getMySubmissions(),
    ];
    if (isStaff) {
      promises.push(moderationService.getAdminAnalytics());
    }
    Promise.all(promises)
      .then(([reviews, submissions, analytics]) => {
        setMyReviews(reviews as Review[]);
        setMySubmissions(submissions as AssetWithStatus[]);
        if (analytics) setAdminStats(analytics as AdminAnalytics);
      })
      .catch(console.error)
      .finally(() => setLoadingActivity(false));
  }, [isAuthenticated, displayUser, isStaff]);

  useEffect(() => {
    if (!displayUser || isStaff || loadingActivity) return;
    recordSubmissionStatusSnapshot(displayUser.id, mySubmissions);
  }, [displayUser, isStaff, loadingActivity, mySubmissions]);

  if (!displayUser || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const reviewCount = myReviews.length;
  const pendingSubmissions = mySubmissions.filter((a) => a.status === 'pending');
  const rejectedSubmissions = mySubmissions.filter((a) => a.status === 'rejected');
  const approvedSubmissions = mySubmissions.filter((a) => a.status === 'approved');

  return (
    <div className="min-h-screen bg-slate-50/80 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardBody className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  {displayUser.avatar ? (
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-primary-600 font-bold">
                      {displayUser.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-slate-900">{displayUser.username}</h1>
                <p className="text-slate-500 text-sm mb-4">{displayUser.email}</p>
                <div className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full mb-4">
                  {displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}
                </div>
                {displayUser.bio && <p className="text-slate-600 text-sm">{displayUser.bio}</p>}
                {displayUser.location && <p className="text-slate-500 text-sm mt-2">📍 {displayUser.location}</p>}
              </CardBody>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {isStaff ? (
              <>
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Account</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">
                          {displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}
                        </p>
                        <p className="text-sm text-slate-500">Role</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">
                          {new Date(displayUser.dateJoined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-500">Member since</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Moderation overview</h2>
                      <Link href="/admin/analytics" className="text-sm text-primary-600 hover:underline">
                        Open dashboard
                      </Link>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {adminStats ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                            <p className="text-2xl font-bold text-amber-700">{adminStats.assetsByStatus.pending}</p>
                            <p className="text-xs text-amber-700/80">In queue</p>
                          </div>
                          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
                            <p className="text-2xl font-bold text-green-700">{adminStats.moderationSummary.approved}</p>
                            <p className="text-xs text-green-700/80">Approved</p>
                          </div>
                          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                            <p className="text-2xl font-bold text-red-700">{adminStats.moderationSummary.rejected}</p>
                            <p className="text-xs text-red-700/80">Rejected</p>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                            <p className="text-2xl font-bold text-blue-700">{adminStats.moderationSummary.requestedChanges}</p>
                            <p className="text-xs text-blue-700/80">Changes req.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Link href="/admin/moderation" className="text-sm font-medium text-primary-600 hover:underline">
                            Review queue ({adminStats.assetsByStatus.pending} pending)
                          </Link>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Loading moderation data&hellip;</p>
                    )}
                  </CardBody>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Your stats</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{displayUser.points}</p>
                        <p className="text-sm text-slate-500">Points</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{displayUser.contributionCount}</p>
                        <p className="text-sm text-slate-500">Places submitted</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{reviewCount}</p>
                        <p className="text-sm text-slate-500">Reviews written</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{displayUser.badges?.length ?? 0}</p>
                        <p className="text-sm text-slate-500">Badges</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
                      <p className="text-sm font-medium text-primary-800">How to earn points</p>
                      <p className="mt-1 text-xs text-primary-700">
                        Earn <span className="font-semibold">50 points</span> when a submitted place is approved,{' '}
                        <span className="font-semibold">10 points</span> for each posted review, and{' '}
                        <span className="font-semibold">5 points</span> for each uploaded image.
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Contribution progress</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                        <p className="text-2xl font-bold text-amber-700">{pendingSubmissions.length}</p>
                        <p className="text-xs text-amber-700/80">Pending review</p>
                      </div>
                      <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                        <p className="text-2xl font-bold text-red-700">{rejectedSubmissions.length}</p>
                        <p className="text-xs text-red-700/80">Needs update</p>
                      </div>
                      <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
                        <p className="text-2xl font-bold text-green-700">{approvedSubmissions.length}</p>
                        <p className="text-xs text-green-700/80">Published</p>
                      </div>
                    </div>
                    {(pendingSubmissions.length > 0 || rejectedSubmissions.length > 0) ? (
                      <ul className="space-y-2">
                        {[...pendingSubmissions, ...rejectedSubmissions].slice(0, 5).map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{a.title}</p>
                              <p className="text-xs text-slate-500">{statusLabel[a.status] ?? a.status}</p>
                            </div>
                            {a.status !== 'approved' ? (
                              <Link
                                href={`/assets/${a.slug}/edit`}
                                className="text-sm text-primary-600 hover:underline"
                              >
                                {a.status === 'rejected' ? 'Edit & resubmit' : 'Modify'}
                              </Link>
                            ) : (
                              <span className="text-xs text-amber-600 font-medium">Awaiting review</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No in-progress submissions right now. New reviews publish instantly; place submissions are moderated here.
                      </p>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Your reviews</h2>
                  </CardHeader>
                  <CardBody>
                    {loadingActivity ? (
                      <p className="text-slate-500 text-sm">Loading...</p>
                    ) : myReviews.length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        You haven&apos;t written any reviews yet.{' '}
                        <Link href="/assets" className="text-primary-600 hover:underline">Explore places</Link> and leave a review.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {myReviews.map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
                            <div>
                              <Link href={`/assets/${r.assetSlug ?? r.asset}`} className="font-medium text-primary-600 hover:underline">
                                {r.assetTitle ?? `Place #${r.asset}`}
                              </Link>
                              <p className="text-sm text-slate-500">{r.title} · {r.rating}/5</p>
                            </div>
                            <Link href={`/assets/${r.assetSlug ?? r.asset}#reviews`} className="text-sm text-slate-500 hover:text-primary-600">View</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Your submitted places</h2>
                  </CardHeader>
                  <CardBody>
                    {loadingActivity ? (
                      <p className="text-slate-500 text-sm">Loading...</p>
                    ) : mySubmissions.length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        You haven&apos;t submitted any places yet.{' '}
                        <Link href="/assets/submit" className="text-primary-600 hover:underline">Submit a place</Link>.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {mySubmissions.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
                            <div>
                              {a.status === 'approved' ? (
                                <Link href={`/assets/${a.slug}`} className="font-medium text-primary-600 hover:underline">
                                  {a.title}
                                </Link>
                              ) : (
                                <span className="font-medium text-slate-900">{a.title}</span>
                              )}
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                a.status === 'approved' ? 'bg-green-100 text-green-800' :
                                a.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {statusLabel[a.status] ?? a.status}
                              </span>
                            </div>
                            {a.status === 'approved' && <Link href={`/assets/${a.slug}`} className="text-sm text-slate-500 hover:text-primary-600">View</Link>}
                            {a.status !== 'approved' && (
                              <Link href={`/assets/${a.slug}/edit`} className="text-sm text-primary-600 hover:underline">
                                {a.status === 'rejected' ? 'Edit' : 'Modify'}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Badges</h2>
                  </CardHeader>
                  <CardBody>
                    {displayUser.badges && displayUser.badges.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {displayUser.badges.map((badge) => (
                          <div key={badge.badgeKey} className="p-4 border border-slate-100 rounded-xl text-center hover:border-primary-200 transition-colors">
                            <span className="text-3xl">{badgeIcons[badge.icon] || '🎖️'}</span>
                            <p className="font-medium text-slate-900 mt-2">{badge.name}</p>
                            <p className="text-xs text-slate-500">{badge.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-500 py-4">No badges yet. Contribute and write reviews to earn them.</p>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Member since</h2>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-600">
                      {new Date(displayUser.dateJoined).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
