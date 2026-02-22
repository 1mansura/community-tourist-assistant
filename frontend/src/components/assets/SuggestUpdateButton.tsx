'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface SuggestUpdateButtonProps {
  href: string;
}

export default function SuggestUpdateButton({ href }: SuggestUpdateButtonProps) {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const loginDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (showLoginPrompt) loginDialogRef.current?.showModal();
    else loginDialogRef.current?.close();
  }, [showLoginPrompt]);

  const loginHref = `/login?redirect=${encodeURIComponent(href)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(href)}`;

  if (isAuthenticated) {
    return (
      <Link href={href} className="text-primary-600 hover:underline font-medium">
        Suggest an update
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowLoginPrompt(true)}
        className="text-primary-600 hover:underline font-medium"
      >
        Suggest an update
      </button>

      <dialog
        ref={loginDialogRef}
        onClose={() => setShowLoginPrompt(false)}
        className="rounded-xl shadow-xl border border-gray-200 p-0 backdrop:bg-black/40 max-w-sm w-full"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in to suggest an update</h2>
          <p className="text-sm text-gray-500 mb-5">
            You need an account to submit update requests.
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
              href={loginHref}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href={registerHref}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
