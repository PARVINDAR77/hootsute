import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialAccountsPage from '../app/(dashboard)/settings/social-accounts/page';
import {
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  SocialAccountDto,
} from '@packages/shared';

// Mock navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock workspace context
let mockCurrentRole = 'OWNER';
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-social-test',
      name: 'Omni Workspace',
      currentUserRole: mockCurrentRole,
    },
    isLoadingWorkspaces: false,
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Multi-Network Social Accounts Settings (LinkedIn & Twitter/X)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockApiClient.mockReset();
    mockCurrentRole = 'OWNER';
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  const mockAccounts: SocialAccountDto[] = [
    {
      id: 'acc-li-1',
      workspaceId: 'ws-social-test',
      provider: SocialProvider.LINKEDIN,
      providerAccountId: 'li-12345',
      accountName: 'Professional Brand',
      accountUsername: 'pro_brand',
      accountType: SocialAccountType.LINKEDIN_PAGE,
      profileImageUrl: null,
      connectionStatus: SocialConnectionStatus.CONNECTED,
      grantedScopes: ['w_organization_social'],
      tokenExpiresAt: null,
      lastValidatedAt: new Date().toISOString(),
      connectedByUserId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acc-tw-1',
      workspaceId: 'ws-social-test',
      provider: SocialProvider.TWITTER_X,
      providerAccountId: 'tw-9988',
      accountName: 'Brand Handle',
      accountUsername: 'BrandHQ',
      accountType: SocialAccountType.TWITTER_PROFILE,
      profileImageUrl: null,
      connectionStatus: SocialConnectionStatus.CONNECTED,
      grantedScopes: ['tweet.read', 'tweet.write'],
      tokenExpiresAt: null,
      lastValidatedAt: new Date().toISOString(),
      connectedByUserId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('should render LinkedIn and Twitter / X connection cards', async () => {
    mockApiClient.mockResolvedValueOnce(mockAccounts);

    render(<SocialAccountsPage />);

    expect(screen.getByText('Social Accounts')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Twitter / X')).toBeInTheDocument();
    expect(screen.getByText('Connect LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Connect Twitter / X')).toBeInTheDocument();
  });

  it('should initiate LinkedIn OAuth when Connect LinkedIn is clicked', async () => {
    mockApiClient
      .mockResolvedValueOnce(mockAccounts)
      .mockResolvedValueOnce({
        authorizationUrl: 'https://linkedin.com/oauth/v2/authorization?test',
        state: 'li-state-xyz',
      });

    render(<SocialAccountsPage />);

    const connectLinkedInBtn = screen.getByText('Connect LinkedIn');
    fireEvent.click(connectLinkedInBtn);

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        '/workspaces/ws-social-test/social-accounts/linkedin/connect',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(window.location.href).toBe('https://linkedin.com/oauth/v2/authorization?test');
    });
  });

  it('should initiate Twitter / X OAuth when Connect Twitter / X is clicked', async () => {
    mockApiClient
      .mockResolvedValueOnce(mockAccounts)
      .mockResolvedValueOnce({
        authorizationUrl: 'https://twitter.com/i/oauth2/authorize?test',
        state: 'tw-state-xyz',
      });

    render(<SocialAccountsPage />);

    const connectTwitterBtn = screen.getByText('Connect Twitter / X');
    fireEvent.click(connectTwitterBtn);

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        '/workspaces/ws-social-test/social-accounts/twitter/connect',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(window.location.href).toBe('https://twitter.com/i/oauth2/authorize?test');
    });
  });

  it('should render connected LinkedIn and Twitter / X accounts in table', async () => {
    mockApiClient.mockResolvedValueOnce(mockAccounts);

    render(<SocialAccountsPage />);

    await waitFor(() => {
      expect(screen.getByText('Professional Brand')).toBeInTheDocument();
      expect(screen.getByText('@BrandHQ')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn Page')).toBeInTheDocument();
      expect(screen.getByText('Twitter / X Profile')).toBeInTheDocument();
    });
  });
});
