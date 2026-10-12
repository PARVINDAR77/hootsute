import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { WorkspaceProvider } from '@/lib/workspace-context';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'OmniSocial AI — AI Social Media Management Platform',
  description:
    'Enterprise AI Social Media Management SaaS for modern marketing teams and brands.',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OmniSocial AI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <WorkspaceProvider>
            {children}
            <ServiceWorkerRegister />
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

