import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Button,
  Card,
  CardTitle,
  Badge,
  Input,
  Tabs,
  StatCard,
  PlatformBadge,
  ORDERED_PLATFORMS,
  AccountCard,
  EmptyState,
  DataTable,
  Modal,
  ConfirmationDialog,
  ThemeToggle,
} from '@/components/ui';
import { ThemeProvider } from '@/lib/theme-context';

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('Phase 1 Futuristic Design System & Dual Theme Engine', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light theme and toggles cleanly to cosmic dark mode', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i });
    fireEvent.click(toggleBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('omnisocial_theme')).toBe('dark');

    const backToLight = screen.getByRole('button', { name: /switch to light theme/i });
    fireEvent.click(backToLight);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('omnisocial_theme')).toBe('light');
  });

  it('renders all 8 supported social platforms via PlatformBadge', () => {
    render(
      <div>
        {ORDERED_PLATFORMS.map((platform) => (
          <PlatformBadge key={platform} platform={platform} />
        ))}
      </div>,
    );

    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Pinterest')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });

  it('supports password visibility toggle in Input component', () => {
    render(<Input label="Password" type="password" placeholder="Enter secret" />);
    const input = screen.getByPlaceholderText('Enter secret') as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(input.type).toBe('text');
  });

  it('renders Tabs, StatCard, AccountCard, DataTable, EmptyState, and Modal correctly', () => {
    const onTabChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <div>
        <Button variant="glow">Launch</Button>
        <Card variant="glass">
          <CardTitle>Glass Card</CardTitle>
        </Card>
        <Badge variant="purple">AI Powered</Badge>
        <Tabs
          value="generator"
          onChange={onTabChange}
          options={[
            { id: 'generator', label: 'Post Generator' },
            { id: 'images', label: 'Image Creator' },
          ]}
        />
        <StatCard label="Total Reach" value="248.5K" trend="+12.5%" trendDirection="up" />
        <AccountCard platform="META_INSTAGRAM" accountCount={2} status="CONNECTED" />
        <DataTable
          data={[{ id: '1', name: 'Summer Campaign' }]}
          rowKey={(r) => r.id}
          columns={[{ key: 'name', header: 'Campaign', render: (r) => r.name }]}
        />
        <EmptyState title="No Campaigns" description="Create your first campaign." />
        <Modal open={true} onClose={() => {}} title="Preview Modal">
          <p>Modal Body</p>
        </Modal>
        <ConfirmationDialog
          open={true}
          onClose={() => {}}
          onConfirm={onConfirm}
          title="Delete Draft?"
          description="This action cannot be undone."
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Image Creator' }));
    expect(onTabChange).toHaveBeenCalledWith('images');
    expect(screen.getByText('248.5K')).toBeInTheDocument();
    expect(screen.getByText('2 accounts')).toBeInTheDocument();
    expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
