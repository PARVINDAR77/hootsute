import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { WorkspaceProvider } from '@/lib/workspace-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#7138F5',
};

export const metadata: Metadata = {
  title: 'OmniSocial AI — AI-Powered Social Media Management Platform',
  description:
    'Manage, create, approve, schedule, and analyze content across Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, and Threads with AI.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OmniSocial AI',
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('omnisocial_theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[#F7F8FC] dark:bg-[#070A18] font-sans text-[#111827] dark:text-slate-100 antialiased selection:bg-[#F1EBFF] selection:text-[#7138F5] dark:selection:bg-[#7138F5]/30 dark:selection:text-white">
        <AuthProvider>
          <ThemeProvider>
            <WorkspaceProvider>
              <ToastProvider>
                {children}
                <ServiceWorkerRegister />
              </ToastProvider>
            </WorkspaceProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
