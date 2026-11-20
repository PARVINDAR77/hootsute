'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Features', href: ROUTES.FEATURES },
  { label: 'Platforms', href: ROUTES.PLATFORMS },
  { label: 'Pricing', href: ROUTES.PRICING },
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Blog', href: ROUTES.BLOG },
  { label: 'Contact', href: ROUTES.CONTACT },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E7EAF2]/80 dark:border-[#1E2749] bg-white/85 dark:bg-[#070A18]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href={ROUTES.HOME} className="group flex items-center shrink-0">
          <BrandLogo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? 'text-[#7138F5] dark:text-[#20C8E8] font-bold bg-[#7138F5]/10 dark:bg-[#20C8E8]/10'
                    : 'text-[#64748B] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <ThemeToggle compact />
          {isAuthenticated ? (
            <Link
              href={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-gradient text-sm font-semibold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href={ROUTES.LOGIN}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#111827] dark:text-slate-200 hover:bg-[#F7F8FC] dark:hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gradient text-sm font-semibold"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="w-9 h-9 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B] flex items-center justify-center text-[#111827] dark:text-white"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E7EAF2] dark:border-white/10 bg-white dark:bg-[#0B1024] px-4 py-4 space-y-2 animate-fadeIn">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    active
                      ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-white'
                      : 'text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8FC] dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-[#E7EAF2] dark:border-white/10 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                href={ROUTES.DASHBOARD}
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl btn-gradient text-sm font-semibold"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-[#E7EAF2] dark:border-white/15 text-sm font-semibold text-[#111827] dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href={ROUTES.SIGNUP}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl btn-gradient text-sm font-semibold"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
