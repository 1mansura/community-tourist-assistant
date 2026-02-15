'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { extractErrorMessage } from '@/lib/api';
import { normalizeLoginErrorMessage } from '@/lib/loginError';
import { getSubmissionStatusNotifications } from '@/lib/submissionNotifications';
import { assetsService } from '@/services/assets';
import { moderationService } from '@/services/moderation';
import { Button, Input, Card, CardBody } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const redirect = searchParams.get('redirect') || '/';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const profile = await login({ email, password });
      const isStaff = profile.role && ['moderator', 'admin'].includes(profile.role);

      if (isStaff) {
        showNotification(
          `Welcome back, ${profile.username}!`,
          'info',
          5000,
          `Logged in as ${profile.role}`,
          { onNextRoute: true },
        );

        moderationService.getQueue().then((queue) => {
          moderationService.getReports().then((reports) => {
            const pendingReports = reports.filter((r) => r.status === 'pending').length;
            const parts: string[] = [];
            if (queue.length > 0) parts.push(`${queue.length} pending submission${queue.length !== 1 ? 's' : ''}`);
            if (pendingReports > 0) parts.push(`${pendingReports} open report${pendingReports !== 1 ? 's' : ''}`);
            if (parts.length > 0) {
              setTimeout(() => {
                showNotification('Moderation update', 'info', 6000, parts.join(' · '));
              }, 550);
            }
          }).catch(() => {});
        }).catch(() => {});

        setTimeout(() => {
          router.push('/profile');
        }, 350);
      } else {
        // Fetch submissions BEFORE navigating so all notifications get fromRouteKey='/login'
        // and are guaranteed to appear on the next page regardless of API response time.
        let statusNotifications: ReturnType<typeof getSubmissionStatusNotifications> = [];
        try {
          const subs = await assetsService.getMySubmissions();
          statusNotifications = getSubmissionStatusNotifications(profile.id, subs);
        } catch {
          // Non-fatal — login proceeds without submission notifications
        }

        const badgeCount = profile.badges?.length ?? 0;
        showNotification(
          `Welcome back, ${profile.username}!`,
          'info',
          5000,
          `Points: ${profile.points} · Badges: ${badgeCount}`,
          { onNextRoute: true },
        );

        statusNotifications.forEach((notification) => {
          showNotification(notification.message, notification.variant, 7000, notification.subtitle, { onNextRoute: true });
        });

        if (profile.badges && profile.badges.length > 0) {
          showNotification(
            `Badge earned: ${profile.badges![profile.badges!.length - 1].name}!`,
            'reward',
            7000,
            profile.badges!.map((b: { name: string }) => b.name).join(' · '),
            { onNextRoute: true },
          );
        }

        router.push(redirect);
      }
    } catch (err) {
      const rawMessage = extractErrorMessage(err);
      const message = normalizeLoginErrorMessage(rawMessage);
      setError(message);

      const lowered = rawMessage.toLowerCase();
      if (lowered.includes('suspended') || lowered.includes('banned')) {
        showNotification(rawMessage, 'error', 6500, 'Contact support/admin if you think this is a mistake.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
              <p className="text-slate-600 mt-2">Sign in to your account</p>
            </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              showPasswordToggle
            />
            
            <Button type="submit" className="w-full" loading={isLoading}>
              Sign In
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </CardBody>
      </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/80 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
