import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopPlatformsDonut } from '../components/analytics/TopPlatformsDonut';

describe('TopPlatformsDonut Component', () => {
  it('renders default platform breakdown when no shares provided', () => {
    render(<TopPlatformsDonut />);
    expect(screen.getByText('Top Platforms')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
  });

  it('renders custom platform shares accurately', () => {
    const customShares = [
      { platform: 'YOUTUBE' as const, label: 'YouTube', percentage: 55, color: '#FF0000' },
      { platform: 'TIKTOK' as const, label: 'TikTok', percentage: 45, color: '#00F2FE' },
    ];
    render(<TopPlatformsDonut shares={customShares} />);
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // channel count
  });
});
