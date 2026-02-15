import type { AssetWithStatus } from '@/types';

type SubmissionStatus = AssetWithStatus['status'];

export interface SubmissionStatusNotification {
  message: string;
  subtitle: string;
  variant: 'reward' | 'error' | 'info';
}

const STORAGE_PREFIX = 'submission-status-snapshot-v1';
const LOGIN_MARKER_PREFIX = 'submission-status-last-login-v1';

function getStorageKey(userId: number): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function getLoginMarkerKey(userId: number): string {
  return `${LOGIN_MARKER_PREFIX}:${userId}`;
}

function safeReadSnapshot(userId: number): Record<string, SubmissionStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SubmissionStatus>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteSnapshot(userId: number, snapshot: Record<string, SubmissionStatus>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(snapshot));
  } catch {
    // Ignore storage write issues gracefully.
  }
}

function safeReadLastLogin(userId: number): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(getLoginMarkerKey(userId));
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function safeWriteLastLogin(userId: number, value: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getLoginMarkerKey(userId), String(value));
  } catch {
    // Ignore storage write issues gracefully.
  }
}

function toSnapshot(submissions: AssetWithStatus[]): Record<string, SubmissionStatus> {
  return submissions.reduce<Record<string, SubmissionStatus>>((acc, submission) => {
    acc[submission.slug] = submission.status;
    return acc;
  }, {});
}

export function recordSubmissionStatusSnapshot(userId: number, submissions: AssetWithStatus[]) {
  safeWriteSnapshot(userId, toSnapshot(submissions));
}

export function getSubmissionStatusNotifications(
  userId: number,
  submissions: AssetWithStatus[],
): SubmissionStatusNotification[] {
  const previous = safeReadSnapshot(userId);
  const previousLogin = safeReadLastLogin(userId);
  const current = toSnapshot(submissions);
  const notifications: SubmissionStatusNotification[] = [];

  const hasPreviousSnapshot = Object.keys(previous).length > 0;
  if (hasPreviousSnapshot) {
    for (const submission of submissions) {
      const before = previous[submission.slug];
      if (!before || before === submission.status) continue;

      if (submission.status === 'approved') {
        notifications.push({
          message: `Congratulations! "${submission.title}" was approved.`,
          subtitle: 'Your place is now live and you earned points for contributing.',
          variant: 'reward',
        });
        continue;
      }

      if (submission.status === 'rejected') {
        notifications.push({
          message: `"${submission.title}" needs changes.`,
          subtitle: 'Open your profile to edit and resubmit it.',
          variant: 'error',
        });
        continue;
      }

      notifications.push({
        message: `"${submission.title}" is back in review.`,
        subtitle: 'A moderator will check your updated submission soon.',
        variant: 'info',
      });
    }
  } else {
    // No snapshot yet (fresh login, demo reset, new account).
    // Show notifications for any approved/rejected submission.
    // If updatedAt is available and previousLogin is set, apply a recency filter so we
    // don't spam on re-login; otherwise show all outcomes so the demo flow always works.
    for (const submission of submissions) {
      if (submission.status !== 'approved' && submission.status !== 'rejected') continue;

      if (previousLogin > 0) {
        const updatedAt = Date.parse(submission.updatedAt);
        if (Number.isFinite(updatedAt) && updatedAt <= previousLogin) continue;
      }

      if (submission.status === 'approved') {
        notifications.push({
          message: `"${submission.title}" was approved!`,
          subtitle: 'Your place is now live and you earned points for contributing.',
          variant: 'reward',
        });
      } else {
        notifications.push({
          message: `"${submission.title}" needs changes.`,
          subtitle: 'Open your profile to edit and resubmit it.',
          variant: 'error',
        });
      }
    }
  }

  safeWriteSnapshot(userId, current);
  safeWriteLastLogin(userId, Date.now());
  return notifications;
}
