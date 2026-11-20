import React from 'react';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PlatformsClientView } from '@/components/marketing/PlatformsClientView';

export const metadata: Metadata = {
  title: 'Supported Platforms — OmniSocial AI',
  description:
    'Official OAuth capabilities, media requirements, analytics, and honest API limitations for Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, and Threads.',
};

export default function PlatformsPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <PlatformsClientView />
      <PublicFooter />
    </div>
  );
}
