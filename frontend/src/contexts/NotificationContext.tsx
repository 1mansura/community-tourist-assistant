'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type NotificationVariant = 'success' | 'info' | 'error' | 'reward';

interface Notification {
  id: number;
  message: string;
  variant: NotificationVariant;
  duration: number;
  subtitle?: string;
}

interface DeferredNotification extends Notification {
  fromRouteKey: string;
}

interface NotificationContextValue {
  showNotification: (
    message: string,
    variant?: NotificationVariant,
    duration?: number,
    subtitle?: string,
    options?: { onNextRoute?: boolean },
  ) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
let nextId = 0;

const MAX_NOTIFICATIONS = 4;

const VARIANT_STYLES: Record<NotificationVariant, { shell: string; icon: string; symbol: string }> = {
  success: {
    shell: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    icon: 'bg-emerald-600 text-white',
    symbol: '✓',
  },
  info: {
    shell: 'border-blue-300 bg-blue-50 text-blue-900',
    icon: 'bg-blue-600 text-white',
    symbol: 'i',
  },
  error: {
    shell: 'border-rose-300 bg-rose-50 text-rose-900',
    icon: 'bg-rose-600 text-white',
    symbol: '!',
  },
  reward: {
    shell: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: 'bg-amber-500 text-amber-950',
    symbol: '★',
  },
};

function NotificationCard({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAtRef = useRef(0);
  const remainingRef = useRef(notification.duration);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const beginDismiss = useCallback(() => {
    clearTimers();
    dismissRef.current();
  }, [clearTimers]);

  const scheduleDismiss = useCallback(() => {
    clearTimers();
    startAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      beginDismiss();
    }, remainingRef.current);
  }, [beginDismiss, clearTimers]);

  useEffect(() => {
    scheduleDismiss();
    return clearTimers;
  }, [scheduleDismiss, clearTimers]);

  const pauseDismiss = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const elapsed = Date.now() - startAtRef.current;
    remainingRef.current = Math.max(remainingRef.current - elapsed, 500);
  }, []);

  const resumeDismiss = useCallback(() => {
    if (timerRef.current) return;
    scheduleDismiss();
  }, [scheduleDismiss]);

  const style = useMemo(() => VARIANT_STYLES[notification.variant], [notification.variant]);

  return (
    <div
      role={notification.variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      onMouseEnter={pauseDismiss}
      onMouseLeave={resumeDismiss}
      onFocus={pauseDismiss}
      onBlur={resumeDismiss}
      className={`pointer-events-auto w-full rounded-2xl border-2 shadow-2xl transition-all duration-200 ease-out translate-y-0 opacity-100 scale-100 ${style.shell}`}
    >
      <div className="flex items-start gap-4 p-5">
        <span
          className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${style.icon}`}
          aria-hidden="true"
        >
          {style.symbol}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-6">{notification.message}</p>
          {notification.subtitle && <p className="mt-1 text-sm leading-5 opacity-90">{notification.subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={beginDismiss}
          className="rounded-lg p-2 opacity-75 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function NotificationViewport({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}) {
  // Show FIFO — first queued notification first, so welcome → status → badge in order.
  const activeNotification = notifications[0] ?? null;
  if (!activeNotification) return null;

  return (
    <div aria-label="Notifications" className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-2xl px-4 sm:px-6">
        <NotificationCard
          key={activeNotification.id}
          notification={activeNotification}
          onDismiss={() => onDismiss(activeNotification.id)}
        />
      </div>
    </div>
  );
}

// How long to wait after landing on a new page before showing the first notification.
const INITIAL_DELAY_MS = 1200;
// Breathing room between consecutive notifications so they don't feel back-to-back.
const BETWEEN_GAP_MS = 400;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queuedForNextRoute, setQueuedForNextRoute] = useState<DeferredNotification[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  // When true, the viewport renders nothing — creates the gap between notifications.
  const [isGap, setIsGap] = useState(false);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const prevRouteKeyRef = useRef<string | null>(null);

  const getCurrentRouteKey = useCallback(() => {
    if (typeof window === 'undefined') return pathname;
    return `${window.location.pathname}${window.location.search}`;
  }, [pathname]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const showNotification = useCallback(
    (
      message: string,
      variant: NotificationVariant = 'success',
      duration = 5000,
      subtitle?: string,
      options?: { onNextRoute?: boolean },
    ) => {
      const id = nextId++;
      const notification = { id, message, variant, duration, subtitle };
      if (options?.onNextRoute) {
        const fromRouteKey = getCurrentRouteKey();
        setQueuedForNextRoute((prev) => [...prev, { ...notification, fromRouteKey }].slice(-MAX_NOTIFICATIONS));
        return;
      }
      setNotifications((prev) => [...prev, notification].slice(-MAX_NOTIFICATIONS));
    },
    [getCurrentRouteKey],
  );

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    // Brief gap so the next notification doesn't instantly slam in.
    if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
    setIsGap(true);
    gapTimerRef.current = setTimeout(() => setIsGap(false), BETWEEN_GAP_MS);
  }, []);

  const value = useMemo(() => ({ showNotification }), [showNotification]);

  useEffect(() => {
    const routeKey = getCurrentRouteKey();
    if (prevRouteKeyRef.current === null) {
      prevRouteKeyRef.current = routeKey;
      return;
    }
    if (prevRouteKeyRef.current === routeKey) return;
    prevRouteKeyRef.current = routeKey;

    // Never keep stale active notifications alive after navigation.
    setNotifications([]);
    setIsGap(false);
    if (gapTimerRef.current) { clearTimeout(gapTimerRef.current); gapTimerRef.current = null; }
  }, [pathname, getCurrentRouteKey]);

  useEffect(() => {
    if (queuedForNextRoute.length === 0) return;
    const currentRouteKey = getCurrentRouteKey();
    const ready = queuedForNextRoute.filter((item) => item.fromRouteKey !== currentRouteKey);
    if (ready.length === 0) return;

    // Move state cleanup inside the timeout so the state update doesn't cancel this
    // effect's cleanup and kill the timer before it fires (race condition).
    const id = setTimeout(() => {
      setQueuedForNextRoute((prev) => prev.filter((item) => item.fromRouteKey === currentRouteKey));
      setNotifications((prev) =>
        [...prev, ...ready.map(({ fromRouteKey: _fromRouteKey, ...notification }) => notification)].slice(-MAX_NOTIFICATIONS),
      );
    }, INITIAL_DELAY_MS);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, getCurrentRouteKey]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {portalTarget && createPortal(
        <NotificationViewport notifications={isGap ? [] : notifications} onDismiss={dismiss} />,
        portalTarget,
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
