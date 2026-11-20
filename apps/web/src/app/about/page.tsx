import React from 'react';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { AboutClientView } from '@/components/marketing/AboutClientView';

export const metadata: Metadata = {
  title: 'About — OmniSocial AI',
  description:
    'Learn about the OmniSocial AI mission, vision, and engineering architecture powering multi-tenant social media operations.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <AboutClientView />
      <PublicFooter />
    </div>
  );
}
