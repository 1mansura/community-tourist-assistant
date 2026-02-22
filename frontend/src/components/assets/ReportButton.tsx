'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { api } from '@/lib/api';

const REPORT_TYPES = [
  { value: 'inaccurate', label: 'Inaccurate Information' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'closed', label: 'Permanently Closed' },
  { value: 'other', label: 'Other' },
] as const;

interface ReportButtonProps {
  assetId: number;
  assetTitle: string;
}

export default function ReportButton({ assetId, assetTitle }: ReportButtonProps) {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const loginDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  useEffect(() => {
    if (showLoginPrompt) loginDialogRef.current?.showModal();
    else loginDialogRef.current?.close();
  }, [showLoginPrompt]);

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType) return;
    setSubmitting(true);
    try {
      await api.post('/moderation/reports/', {
        asset: assetId,
        report_type: reportType,
        description,
      });
      showNotification('Thanks for flagging this!', 'success', 6000, 'A moderator will review your report shortly. We appreciate you helping keep the platform accurate.');
      setOpen(false);
      setReportType('');
      setDescription('');
    } catch {
      showNotification('Failed to submit report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
        title="Report this content"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
        </svg>
        Report
      </button>

      <dialog
        ref={loginDialogRef}
        onClose={() => setShowLoginPrompt(false)}
        className="rounded-xl shadow-xl border border-gray-200 p-0 backdrop:bg-black/40 max-w-sm w-full"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in to report</h2>
          <p className="text-sm text-gray-500 mb-5">
            You need an account to report content. This helps us track reports and keep the platform safe.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </dialog>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="rounded-xl shadow-xl border border-gray-200 p-0 backdrop:bg-black/40 max-w-md w-full"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Report content</h2>
          <p className="text-sm text-gray-500 mb-4">
            Flag an issue with <strong className="text-gray-700">{assetTitle}</strong>
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a reason…</option>
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add any details that might help moderators…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-5 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reportType}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
