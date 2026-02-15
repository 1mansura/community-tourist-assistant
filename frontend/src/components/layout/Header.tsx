'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Compass,
  Map,
  Home,
  Info,
  PlusCircle,
  ShieldCheck,
  Flag,
  LogOut,
  LogIn,
  UserPlus,
  Trophy,
  BarChart3,
  UserCircle2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { clsx } from 'clsx';

const publicNavLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/assets', label: 'Explore', icon: Compass },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/about', label: 'About', icon: Info },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isStaff = user?.role && ['moderator', 'admin'].includes(user.role);

  const navLinks = isStaff
    ? [{ href: '/', label: 'Home', icon: Home }]
    : publicNavLinks;

  return (
    <header className="glass sticky top-0 z-50 border-b border-slate-200/50 shadow-sm">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4"
      >
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">CTA</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </motion.span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {!isStaff && (
                  <>
                    <Link href="/assets/submit">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Submit
                      </motion.span>
                    </Link>
                    <Link href="/leaderboard">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Trophy className="h-4 w-4" />
                        Leaderboard
                      </motion.span>
                    </Link>
                  </>
                )}
                <Link href="/profile">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    Profile
                  </motion.span>
                </Link>
                {isStaff && (
                  <>
                    <Link href="/admin/analytics">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </motion.span>
                    </Link>
                    <Link href="/admin/moderation">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Moderation
                      </motion.span>
                    </Link>
                    <Link href="/admin/reports">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Flag className="h-4 w-4" />
                        Reports
                      </motion.span>
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <span className="text-sm font-medium text-slate-600 truncate max-w-[120px]">
                    {user?.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="flex items-center gap-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-100 py-4"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
                        pathname === link.href
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
                {isAuthenticated ? (
                  <>
                    {!isStaff && (
                      <>
                        <Link
                          href="/assets/submit"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-600"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Submit Place
                        </Link>
                        <Link
                          href="/leaderboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                        >
                          <Trophy className="h-4 w-4" />
                          Leaderboard
                        </Link>
                      </>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      Profile
                    </Link>
                    {isStaff && (
                      <>
                        <Link
                          href="/admin/analytics"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/admin/moderation"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Moderation
                        </Link>
                        <Link
                          href="/admin/reports"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                        >
                          <Flag className="h-4 w-4" />
                          Reports
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 text-left hover:bg-slate-50 rounded-xl"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-600"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
