'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  MediaAssetDto,
  MediaType,
  MediaProcessingStatus,
  UploadSessionResponseDto,
} from '@packages/shared';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Search,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetDto) => void;
  selectedAssetId?: string | null;
  allowedMediaType?: MediaType;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedAssetId,
  allowedMediaType,
}: MediaPickerModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [assets, setAssets] = useState<MediaAssetDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetDto | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentWorkspace?.id) {
      loadMedia();
    }
  }, [isOpen, currentWorkspace?.id, allowedMediaType]);

  const loadMedia = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      let queryUrl = `/workspaces/${currentWorkspace.id}/media?status=READY&limit=40`;
      if (allowedMediaType) queryUrl += `&mediaType=${allowedMediaType}`;
      if (search.trim()) queryUrl += `&search=${encodeURIComponent(search.trim())}`;

      const res = await apiClient<any>(queryUrl);
      const fetched: MediaAssetDto[] = Array.isArray(res) ? res : (res?.data || []);
      setAssets(fetched);

      if (selectedAssetId) {
        const found = fetched.find((a) => a.id === selectedAssetId);
        if (found) setSelectedAsset(found);
      }
    } catch (err: any) {
      console.error('Failed to load media picker assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!currentWorkspace) return;
    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      // 1. Session request
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
        // Direct upload fallback
        const formData = new FormData();
        formData.append('file', file);
        const directRes = await apiClient<any>(
          `/workspaces/${currentWorkspace.id}/media/direct-upload`,
          {
            method: 'POST',
            body: formData,
          },
        );
        const directAsset: MediaAssetDto = directRes?.data ?? directRes;
        setSelectedAsset(directAsset);
        onSelect(directAsset);
        onClose();
        return;
      }

      setUploadProgress(50);
      const session: UploadSessionResponseDto = (sessionRes as any)?.data ?? sessionRes;

      // 2. Direct PUT to signed URL
      const putRes = await fetch(session.uploadUrl, {
        method: session.method || 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          ...(session.headers || {}),
        },
        body: file,
      });

      if (!putRes.ok && putRes.status !== 200 && putRes.status !== 204) {
        throw new Error(`Upload returned status ${putRes.status}`);
      }

      setUploadProgress(85);

      // 3. Complete verification on backend
      const completeRes = await apiClient<any>(
        `/workspaces/${currentWorkspace.id}/media/${session.assetId}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );

      const completedAsset: MediaAssetDto = completeRes?.data ?? completeRes;
      setUploadProgress(100);
      setSelectedAsset(completedAsset);
      onSelect(completedAsset);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload media asset');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Media Asset</h3>
              <p className="text-xs text-slate-500">Attach high-resolution creatives to your social post</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/50 text-xs">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all ${
              activeTab === 'library'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Workspace Media Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Upload New File
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[350px]">
          {activeTab === 'library' ? (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter media library by filename..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="aspect-square bg-slate-100 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No verified media found</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('upload')}
                    className="text-xs"
                  >
                    Upload an Image Now
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {asset.mediaType === MediaType.IMAGE && asset.accessUrl ? (
                          <img
                            src={asset.accessUrl}
                            alt={asset.originalFilename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2">
                            <Video className="w-6 h-6 text-indigo-400 mb-1" />
                            <span className="text-[9px] uppercase font-bold truncate max-w-full">
                              Video
                            </span>
                          </div>
                        )}

                        {/* Selected Check Badge */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 p-1 text-[10px] text-white truncate font-medium">
                          {asset.originalFilename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Upload Tab */
            <div className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                className="hidden"
              />

              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isUploading
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    {isUploading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  {isUploading ? (
                    <div className="space-y-2 w-full max-w-xs">
                      <p className="text-xs font-semibold text-slate-800">
                        Uploading and verifying file signature ({uploadProgress}%)...
                      </p>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-slate-800">
                        Click or drag file to upload into workspace
                      </div>
                      <div className="text-[11px] text-slate-400">
                        PNG, JPEG, WebP (up to 15MB) or MP4, MOV (up to 100MB)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 truncate max-w-sm">
            {selectedAsset ? (
              <span className="font-medium text-slate-800 truncate">
                Selected: {selectedAsset.originalFilename}
                {selectedAsset.width && selectedAsset.height ? ` (${selectedAsset.width}x${selectedAsset.height})` : ''}
              </span>
            ) : (
              'No asset selected'
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedAsset}
              onClick={() => {
                if (selectedAsset) {
                  onSelect(selectedAsset);
                  onClose();
                }
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Attach to Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
