'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  MediaAssetDto,
  MediaType,
  MediaProcessingStatus,
  UploadSessionResponseDto,
  WorkspaceStorageUsageDto,
} from '@packages/shared';
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  X,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

export default function MediaLibraryPage() {
  const { currentWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<MediaAssetDto[]>([]);
  const [storageUsage, setStorageUsage] = useState<WorkspaceStorageUsageDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | MediaType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MediaProcessingStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drag and Drop / Uploading state
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState<
    Array<{
      id: string;
      filename: string;
      progress: number;
      status: 'pending' | 'uploading' | 'verifying' | 'done' | 'error';
      error?: string;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [previewAsset, setPreviewAsset] = useState<MediaAssetDto | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<MediaAssetDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadMedia();
    }
  }, [currentWorkspace?.id, mediaTypeFilter, statusFilter]);

  const loadMedia = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      let queryUrl = `/workspaces/${currentWorkspace.id}/media?limit=50`;
      if (mediaTypeFilter !== 'ALL') queryUrl += `&mediaType=${mediaTypeFilter}`;
      if (statusFilter !== 'ALL') queryUrl += `&status=${statusFilter}`;
      if (search.trim()) queryUrl += `&search=${encodeURIComponent(search.trim())}`;

      const mediaRes = await apiClient<{ success: boolean; data: MediaAssetDto[] }>(queryUrl);
      setAssets(mediaRes.data || []);

      try {
        const usagePromise = apiClient<{ success: boolean; data: WorkspaceStorageUsageDto }>(
          `/workspaces/${currentWorkspace.id}/media/storage-usage`,
        );
        if (usagePromise && typeof usagePromise.then === 'function') {
          const usageRes = await usagePromise;
          if (usageRes?.data) {
            setStorageUsage(usageRes.data);
          }
        }
      } catch {
        // Optional quota metric fetch
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to load media assets' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia();
  };

  // Upload handler (Direct-to-cloud with server-mediated fallback)
  const processFiles = async (files: FileList | File[]) => {
    if (!currentWorkspace) return;

    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    for (const file of fileList) {
      const uploadId = Math.random().toString(36).substring(7);

      // Add to active uploads
      setActiveUploads((prev) => [
        {
          id: uploadId,
          filename: file.name,
          progress: 10,
          status: 'pending',
        },
        ...prev,
      ]);

      try {
        // Step 1: Request upload session
        setActiveUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 25, status: 'uploading' } : u)),
        );

        let sessionRes: { success: boolean; data: UploadSessionResponseDto };
        try {
          sessionRes = await apiClient<{ success: boolean; data: UploadSessionResponseDto }>(
            `/workspaces/${currentWorkspace.id}/media/upload-sessions`,
            {
              method: 'POST',
              body: JSON.stringify({
                filename: file.name,
                mimeType: file.type || 'image/jpeg',
                sizeBytes: file.size,
              }),
            },
          );
        } catch (sessionErr: any) {
          // If direct upload session fails, try direct server-mediated upload
          const formData = new FormData();
          formData.append('file', file);

          await apiClient(`/workspaces/${currentWorkspace.id}/media/direct-upload`, {
            method: 'POST',
            body: formData,
          });

          setActiveUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u)),
          );
          loadMedia();
          continue;
        }

        const session = sessionRes.data;

        // Step 2: Upload file bytes directly to the signed URL
        setActiveUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 60 } : u)),
        );

        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type || 'image/jpeg',
          ...(session.headers || {}),
        };

        const putRes = await fetch(session.uploadUrl, {
          method: session.method || 'PUT',
          headers: uploadHeaders,
          body: file,
        });

        if (!putRes.ok && putRes.status !== 200 && putRes.status !== 204) {
          throw new Error(`Upload to storage returned status ${putRes.status}`);
        }

        // Step 3: Complete upload on backend
        setActiveUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 85, status: 'verifying' } : u)),
        );

        await apiClient(
          `/workspaces/${currentWorkspace.id}/media/${session.assetId}/complete`,
          {
            method: 'POST',
            body: JSON.stringify({}),
          },
        );

        setActiveUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u)),
        );

        loadMedia();
      } catch (err: any) {
        setActiveUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, status: 'error', error: err.message || 'Upload failed' }
              : u,
          ),
        );
      }
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace || !deleteAsset) return;
    setIsDeleting(true);
    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/media/${deleteAsset.id}`, {
        method: 'DELETE',
      });
      setAlertMsg({ type: 'success', message: `Deleted "${deleteAsset.originalFilename}"` });
      setDeleteAsset(null);
      loadMedia();
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to delete asset' });
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ImageIcon className="w-5 h-5" />
            </span>
            Media Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Secure cloud storage for high-resolution graphics, festival creatives, and social video assets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && processFiles(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media</span>
          </Button>
        </div>
      </div>

      {alertMsg && (
        <Alert
          type={alertMsg.type}
          message={alertMsg.message}
          onClose={() => setAlertMsg(null)}
        />
      )}

      {/* Storage Quota & Capacity Overview Card */}
      {storageUsage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Storage Meter Card */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Storage Usage</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  storageUsage.planTier === 'ENTERPRISE'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : storageUsage.planTier === 'PRO'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {storageUsage.planTier} Plan
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {formatBytes(storageUsage.usedBytes)} of {formatBytes(storageUsage.quotaBytes)} ({storageUsage.usagePercentage}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storageUsage.usagePercentage >= 90
                    ? 'bg-rose-500'
                    : storageUsage.usagePercentage >= 75
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, storageUsage.usagePercentage))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{formatBytes(storageUsage.remainingBytes)} free space remaining</span>
              {storageUsage.isQuotaExceeded && (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Storage quota limit reached
                </span>
              )}
            </div>
          </div>

          {/* Asset Count & Breakdown Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Asset Capacity</span>
              <span className="text-xs font-medium text-slate-500">
                {storageUsage.assetCounts.total} / {storageUsage.assetCounts.maxAssets} limit
              </span>
            </div>
            <div className="flex items-center gap-4 py-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>{storageUsage.assetCounts.images} Images</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{storageUsage.assetCounts.videos} Videos</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Max {storageUsage.assetCounts.maxAssets} assets per workspace
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
            : 'border-slate-200 hover:border-indigo-300 bg-gradient-to-b from-white to-slate-50/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-xs font-semibold text-slate-800">
            Drag and drop images or videos here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-600 hover:text-indigo-700 underline font-bold"
            >
              browse files
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>PNG, JPEG, WebP (up to 15MB)</span>
            <span>•</span>
            <span>MP4, MOV (up to 100MB)</span>
          </div>
        </div>
      </div>

      {/* Active Uploads Bar */}
      {activeUploads.length > 0 && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-indigo-100">
            <CardTitle className="text-xs font-bold text-indigo-900 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              Upload Queue ({activeUploads.filter((u) => u.status !== 'done').length} remaining)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveUploads((prev) => prev.filter((u) => u.status !== 'done'))}
              className="text-[10px] h-6 px-2"
            >
              Clear Completed
            </Button>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-48 overflow-y-auto">
            {activeUploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-2 truncate max-w-md">
                  {upload.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : upload.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 truncate">{upload.filename}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {upload.status === 'error' ? (
                    <span className="text-[11px] text-rose-600 font-semibold">{upload.error}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{upload.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filter and View Mode Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search media by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="text-xs h-8">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Media Type Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setMediaTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mediaTypeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaTypeFilter(MediaType.IMAGE)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mediaTypeFilter === MediaType.IMAGE
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setMediaTypeFilter(MediaType.VIDEO)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mediaTypeFilter === MediaType.VIDEO
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Videos
            </button>
          </div>

          {/* Grid vs List */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Assets Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No media assets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your first social graphics or brand assets to attach them to AI-generated campaigns.
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Now
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => setPreviewAsset(asset)}
                className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden flex items-center justify-center group-hover:opacity-95 transition-opacity"
              >
                {asset.mediaType === MediaType.IMAGE && asset.accessUrl ? (
                  <img
                    src={asset.accessUrl}
                    alt={asset.originalFilename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Video className="w-8 h-8 text-indigo-400 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Video</span>
                  </div>
                )}

                {/* Status Overlay if not READY */}
                {asset.processingStatus !== MediaProcessingStatus.READY && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                    <Badge variant={asset.processingStatus === MediaProcessingStatus.FAILED ? 'danger' : 'warning'}>
                      {asset.processingStatus}
                    </Badge>
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAsset(asset);
                    }}
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-transform hover:scale-105"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {asset.accessUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(asset.accessUrl!, asset.id);
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-transform hover:scale-105"
                      title="Copy signed URL"
                    >
                      {copiedId === asset.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteAsset(asset);
                    }}
                    className="p-1.5 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-lg shadow-sm transition-transform hover:scale-105"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                <div className="truncate text-xs font-semibold text-slate-800" title={asset.originalFilename}>
                  {asset.originalFilename}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{formatBytes(asset.sizeBytes)}</span>
                  {asset.width && asset.height && (
                    <span>
                      {asset.width}x{asset.height}
                    </span>
                  )}
                </div>
                {asset.usageCount !== undefined && asset.usageCount > 0 && (
                  <div className="pt-1 text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    <span>Used in {asset.usageCount} variant{asset.usageCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {assets.map((asset) => (
            <div key={asset.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3 truncate">
                <div
                  onClick={() => setPreviewAsset(asset)}
                  className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                >
                  {asset.mediaType === MediaType.IMAGE && asset.accessUrl ? (
                    <img src={asset.accessUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">{asset.originalFilename}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{formatBytes(asset.sizeBytes)}</span>
                    {asset.width && asset.height && (
                      <>
                        <span>•</span>
                        <span>{asset.width}x{asset.height}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={asset.processingStatus === 'READY' ? 'success' : 'warning'}>
                  {asset.processingStatus}
                </Badge>
                <button
                  onClick={() => setPreviewAsset(asset)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteAsset(asset)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="truncate pr-4">
                <h3 className="text-sm font-bold text-slate-900 truncate">{previewAsset.originalFilename}</h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {previewAsset.id}</span>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[300px]">
              {previewAsset.mediaType === MediaType.IMAGE && previewAsset.accessUrl ? (
                <img
                  src={previewAsset.accessUrl}
                  alt={previewAsset.originalFilename}
                  className="max-h-[50vh] max-w-full object-contain rounded-lg"
                />
              ) : previewAsset.accessUrl ? (
                <video
                  src={previewAsset.accessUrl}
                  controls
                  className="max-h-[50vh] max-w-full rounded-lg"
                />
              ) : (
                <div className="text-slate-400 text-xs">Preview unavailable</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Dimensions</span>
                <span className="font-medium text-slate-800">
                  {previewAsset.width && previewAsset.height ? `${previewAsset.width} x ${previewAsset.height}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">File Size</span>
                <span className="font-medium text-slate-800">{formatBytes(previewAsset.sizeBytes)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Type</span>
                <span className="font-medium text-slate-800">{previewAsset.mimeType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Storage</span>
                <span className="font-medium text-slate-800">{previewAsset.storageProvider}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Media Asset</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{deleteAsset.originalFilename}"</span>?
              {deleteAsset.usageCount && deleteAsset.usageCount > 0 ? (
                <span className="block mt-2 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ This asset is currently attached to {deleteAsset.usageCount} content variant(s). Deleting it will detach the media reference from non-published drafts.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteAsset(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
