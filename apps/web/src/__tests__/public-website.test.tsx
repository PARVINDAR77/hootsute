import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/app/page';
import PlatformsPage from '@/app/platforms/page';
import ContactPage from '@/app/contact/page';
import PricingPage from '@/app/pricing/page';
import AboutPage from '@/app/about/page';
import BlogPage from '@/app/blog/page';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
  unwrapData: (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res),
}));

describe('Phase 2 Public Marketing Website', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Homepage with required hero copy and fetches real backend overview & plans', async () => {
    mockApiClient.mockImplementation((path: string) => {
      if (path === '/public/overview') {
        return Promise.resolve({
          supportedPlatformsCount: 8,
          activeWorkspacesCount: 4,
          connectedAccountsCount: 16,
          publishedPostsCount: 22,
          aiDraftsGeneratedCount: 35,
        });
      }
      if (path === '/billing/plans') {
        return Promise.resolve([
          {
            plan: 'FREE',
            displayName: 'Starter Free',
            description: 'Starter plan',
            monthlyPriceCents: 0,
            yearlyPriceCents: 0,
            storageQuotaBytes: 5368709120,
            maxMediaAssets: 500,
            maxSocialAccounts: 2,
            monthlyAiTokens: 50,
            features: [{ name: 'Cloud Media Storage', included: true, limitText: '5 GB' }],
          },
        ]);
      }
      return Promise.resolve({});
    });

    render(<HomePage />);

    expect(screen.getByText(/Manage\. Create\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Scale Your Brand Across 8 Social Networks with Autonomous AI Intelligence\./i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Starter Free')).toBeInTheDocument();
    });
  });

  it('renders all 8 supported platforms with official limitations on /platforms', () => {
    render(<PlatformsPage />);
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Pinterest')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });

  it('fetches live billing plans on /pricing and toggles monthly/yearly', async () => {
    mockApiClient.mockResolvedValue([
      {
        plan: 'PRO',
        displayName: 'Growth Pro',
        description: 'Scaling brands',
        monthlyPriceCents: 2900,
        yearlyPriceCents: 29000,
        storageQuotaBytes: 53687091200,
        maxMediaAssets: 5000,
        maxSocialAccounts: 10,
        monthlyAiTokens: 1000,
        isPopular: true,
        features: [{ name: 'Connected Social Accounts', included: true, limitText: '10 Accounts' }],
      },
    ]);

    render(<PricingPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Growth Pro').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('$29')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Yearly/i }));
    expect(screen.getByText(/\$290 \/ year total/i)).toBeInTheDocument();
  });

  it('submits validated contact form to POST /public/contact', async () => {
    mockApiClient.mockResolvedValue({
      message: 'Received',
      inquiry: { id: 'inq-999' },
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByPlaceholderText('Alex Rivera'), {
      target: { value: 'Priya Sharma' },
    });
    fireEvent.change(screen.getByPlaceholderText('alex@company.com'), {
      target: { value: 'priya@brand.io' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enterprise plan / onboarding'), {
      target: { value: 'Agency Demo' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Tell us about your team size/i),
      { target: { value: 'We manage 15 client accounts and want to evaluate Enterprise.' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        '/public/contact',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(screen.getByText(/inq-999/i)).toBeInTheDocument();
    });
  });

  it('renders enterprise contact departments, SLA guarantees, and interactive FAQs', () => {
    render(<ContactPage />);

    // Specialized Department Desks
    expect(screen.getAllByText(/Enterprise Sales & Custom Quotas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/24\/7 Technical Support & Dispatch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Security, Compliance & Legal Desk/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Agency Partner Program & API Alliances/i).length).toBeGreaterThan(0);

    // Enterprise SLA Guarantees Card
    expect(screen.getByText(/Enterprise SLA Guarantees/i)).toBeInTheDocument();
    expect(screen.getByText(/15-Minute Priority Response/i)).toBeInTheDocument();

    // Contact FAQ Section
    expect(screen.getByText(/Frequently Asked Contact Questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Can your team execute a mutual NDA before our technical demo\?/i)).toBeInTheDocument();
  });

  it('renders upgraded about page with telemetry showcase and decision values', () => {
    render(<AboutPage />);

    // Hero Section & Metrics
    expect(screen.getByText(/Pioneering Autonomous Social Operations for the/i)).toBeInTheDocument();
    expect(screen.getAllByText(/8 Channels/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AES-256-GCM/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/100% RBAC/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12,000\+/i).length).toBeGreaterThan(0);

    // 4 Guiding Values
    expect(screen.getByText(/Velocity with Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Official API Integrity/i)).toBeInTheDocument();
    expect(screen.getByText(/Design Craftsmanship/i)).toBeInTheDocument();
    expect(screen.getByText(/Radical Multi-Tenant Isolation/i)).toBeInTheDocument();

    // Official 8 Platforms Dock
    expect(screen.getByText(/Direct Official Partnerships Across 8 Networks/i)).toBeInTheDocument();
  });

  it('renders blog page with featured hero blueprint and 3D visual preview', () => {
    render(<BlogPage />);

    // Blog Hero
    expect(screen.getByText(/Architectural Insights for/i)).toBeInTheDocument();

    // Featured Hero Blueprint & Image
    expect(
      screen.getByText(/How to Scale Campaign Publishing Across 8 Social Networks Without Losing Brand Voice/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Featured Blueprint/i)).toBeInTheDocument();
    const img = screen.getByAltText(/How to Scale Campaign Publishing Across 8 Social Networks/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/blog-featured-campaign-scaling.png');

    // Category Filter Chips
    expect(screen.getAllByText(/Publishing Strategy/i).length).toBeGreaterThan(0);
  });
});
