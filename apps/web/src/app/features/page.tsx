import React from 'react';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { FeaturesClientView } from '@/components/marketing/FeaturesClientView';

export const metadata: Metadata = {
  title: 'Features — OmniSocial AI',
  description:
    'Explore all 14 core capabilities of OmniSocial AI: 8-platform account management, AI Content Studio, bulk publishing, calendar, unified inbox, analytics, and team approvals.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <FeaturesClientView />
      <PublicFooter />
    </div>
  );
}
