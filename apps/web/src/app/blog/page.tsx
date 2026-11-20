import React from 'react';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { BlogClientView } from '@/components/marketing/BlogClientView';

export const metadata: Metadata = {
  title: 'Blog & Guides — OmniSocial AI',
  description:
    'Playbooks on multi-platform publishing, AI Brand Kits, team approval workflows, and agency workspace security.',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <BlogClientView />
      <PublicFooter />
    </div>
  );
}
