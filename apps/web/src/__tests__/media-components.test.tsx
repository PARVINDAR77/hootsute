import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaPickerModal } from '../components/media/MediaPickerModal';
import MediaLibraryPage from '../app/(dashboard)/media/page';
import {
  MediaType,
  MediaProcessingStatus,
  MediaStorageProvider,
  MediaAssetDto,
} from '@packages/shared';

// Mock workspace context
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-test-123',
      name: 'Omni Workspace',
      currentUserRole: 'OWNER',
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('MediaPickerModal Component', () => {
  const mockAssets: MediaAssetDto[] = [
    {
      id: 'media-1',
      workspaceId: 'ws-test-123',
      uploadedByUserId: 'user-1',
      originalFilename: 'festive-banner.png',
      storageKey: 'workspaces/ws-test-123/media/media-1.png',
      storageProvider: MediaStorageProvider.LOCAL_MOCK,
      mimeType: 'image/png',
      mediaType: MediaType.IMAGE,
      sizeBytes: 1024000,
      width: 1200,
      height: 630,
      processingStatus: MediaProcessingStatus.READY,
      accessUrl: 'https://cdn.example.com/festive-banner.png',
      createdAt: '2026-10-12T10:00:00.000Z',
      updatedAt: '2026-10-12T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with tabs and loads workspace assets', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: mockAssets,
    });

    const onSelect = jest.fn();
    const onClose = jest.fn();

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Select Media Asset')).toBeInTheDocument();
    expect(screen.getByText('Workspace Media Library')).toBeInTheDocument();
    expect(screen.getByText('Upload New File')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('festive-banner.png')).toBeInTheDocument();
    });
  });

  it('allows selecting an asset and attaches it', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: mockAssets,
    });

    const onSelect = jest.fn();
    const onClose = jest.fn();

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('festive-banner.png')).toBeInTheDocument();
    });

    // Click asset thumbnail
    fireEvent.click(screen.getByText('festive-banner.png'));

    expect(screen.getByText(/Selected: festive-banner\.png/)).toBeInTheDocument();

    // Click attach button
    fireEvent.click(screen.getByRole('button', { name: /Attach to Post/i }));

    expect(onSelect).toHaveBeenCalledWith(mockAssets[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('switches to Upload tab on demand', () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Upload New File'));
    expect(screen.getByText(/Click or drag file to upload into workspace/i)).toBeInTheDocument();
  });
});

describe('MediaLibraryPage Component', () => {
  const mockAssets: MediaAssetDto[] = [
    {
      id: 'media-1',
      workspaceId: 'ws-test-123',
      uploadedByUserId: 'user-1',
      originalFilename: 'hero-graphic.png',
      storageKey: 'workspaces/ws-test-123/media/media-1.png',
      storageProvider: MediaStorageProvider.LOCAL_MOCK,
      mimeType: 'image/png',
      mediaType: MediaType.IMAGE,
      sizeBytes: 2048000,
      width: 1920,
      height: 1080,
      processingStatus: MediaProcessingStatus.READY,
      accessUrl: 'https://cdn.example.com/hero-graphic.png',
      createdAt: '2026-10-12T10:00:00.000Z',
      updatedAt: '2026-10-12T10:00:00.000Z',
      usageCount: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders media library header, dropzone, and assets grid', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: mockAssets,
    });

    render(<MediaLibraryPage />);

    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop images or videos here/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('hero-graphic.png')).toBeInTheDocument();
      expect(screen.getByText('1920x1080')).toBeInTheDocument();
      expect(screen.getByText(/Used in 2 variants/i)).toBeInTheDocument();
    });
  });

  it('opens preview modal when asset thumbnail is clicked', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: mockAssets,
    });

    render(<MediaLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('hero-graphic.png')).toBeInTheDocument();
    });

    // Click preview button
    const previewButtons = screen.getAllByTitle('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/ID: media-1/i)).toBeInTheDocument();
      expect(screen.getByText('1920 x 1080')).toBeInTheDocument();
    });
  });

  it('renders storage quota usage card when metrics are loaded', async () => {
    mockApiClient
      .mockResolvedValueOnce({
        success: true,
        data: mockAssets,
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          workspaceId: 'ws-test-123',
          planTier: 'PRO',
          usedBytes: 104857600,
          quotaBytes: 10737418240,
          usagePercentage: 1.0,
          isQuotaExceeded: false,
          remainingBytes: 10632560640,
          assetCounts: {
            total: 15,
            images: 10,
            videos: 5,
            maxAssets: 1000,
          },
        },
      });

    render(<MediaLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('Storage Usage')).toBeInTheDocument();
      expect(screen.getByText('PRO Plan')).toBeInTheDocument();
      expect(screen.getByText('Asset Capacity')).toBeInTheDocument();
      expect(screen.getByText('10 Images')).toBeInTheDocument();
      expect(screen.getByText('5 Videos')).toBeInTheDocument();
    });
  });
});
