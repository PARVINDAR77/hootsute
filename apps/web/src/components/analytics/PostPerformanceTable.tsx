'use client';

import React from 'react';
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Globe,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  Eye,
  Radio,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatMetricNumber } from './AnalyticsKPICard';

export interface PostPerformanceItem {
  id: string;
  externalPostId: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  postType: string;
  publishedAt: string | null;
  snapshotDate: string;
  likesCount: number | null;
  commentsCount: number | null;
  sharesCount: number | null;
  savesCount: number | null;
  impressions: number | null;
  reach: number | null;
  engagementRate: number | null;
  isScheduledViaOmniSocial: boolean;
  externalPostUrl: string | null;
  previewText: string | null;
  socialAccount?: {
    id: string;
    accountName: string;
    accountUsername: string | null;
    provider: string;
    profileImageUrl: string | null;
  };
}

interface PostPerformanceTableProps {
  posts: PostPerformanceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onPageChange: (newPage: number) => void;
  selectedPostType: string;
  onPostTypeChange: (type: string) => void;
  isLoading?: boolean;
}

export function PostPerformanceTable({
  posts = [],
  total = 0,
  page = 1,
  limit = 20,
  totalPages = 1,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  selectedPostType,
  onPostTypeChange,
  isLoading = false,
}: PostPerformanceTableProps) {
  const sortColumns = [
    { key: 'publishedAt', label: 'Published' },
    { key: 'likesCount', label: 'Likes' },
    { key: 'commentsCount', label: 'Comments' },
    { key: 'sharesCount', label: 'Shares' },
    { key: 'savesCount', label: 'Saves' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'reach', label: 'Reach' },
    { key: 'engagementRate', label: 'Eng. Rate' },
  ];

  return (
    <Card className="border border-slate-200/80 shadow-xs bg-white">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            Post Performance Breakdown
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual post engagement and reach tracking with attribution source linkage.
          </p>
        </div>

        {/* Post Type filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Format:</label>
          <select
            value={selectedPostType}
            onChange={(e) => onPostTypeChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Formats</option>
            <option value="POST">Static Post</option>
            <option value="REEL">Reel / Video</option>
            <option value="STORY">Story</option>
            <option value="CAROUSEL">Carousel</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Post &amp; Source</th>
                <th className="py-3 px-3">Platform</th>
                {sortColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => onSortChange(col.key)}
                    className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      <ArrowUpDown
                        className={`w-3 h-3 ${
                          sortBy === col.key ? 'text-indigo-600 font-bold' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-48 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                    </td>
                    {Array.from({ length: 8 }).map((_, cIdx) => (
                      <td key={cIdx} className="py-3.5 px-3">
                        <div className="h-4 w-10 bg-slate-200 rounded" />
                      </td>
                    ))}
                    <td className="py-3.5 px-3 text-right">
                      <div className="h-4 w-6 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No post records found</p>
                    <p className="text-xs mt-1 text-slate-400">
                      Try adjusting the date range or platform filter.
                    </p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const dateStr = post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Unknown';

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Post Preview & Source Badge */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span
                            className="font-medium text-slate-800 line-clamp-2"
                            title={post.previewText || 'No text preview available'}
                          >
                            {post.previewText || (
                              <span className="italic text-slate-400 font-normal">
                                Post #{post.externalPostId.slice(-8)}
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {post.isScheduledViaOmniSocial ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>OmniSocial</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                                <Globe className="w-2.5 h-2.5 text-slate-400" />
                                <span>Platform Native</span>
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400">
                              {post.socialAccount?.accountName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            post.platform === 'FACEBOOK'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {post.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'}
                        </span>
                      </td>

                      {/* Published Date */}
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Likes */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {formatMetricNumber(post.likesCount)}
                      </td>

                      {/* Comments */}
                      <td className="py-3 px-3 text-slate-700">
                        {formatMetricNumber(post.commentsCount)}
                      </td>

                      {/* Shares */}
                      <td className="py-3 px-3 text-slate-700">
                        {formatMetricNumber(post.sharesCount)}
                      </td>

                      {/* Saves */}
                      <td className="py-3 px-3 text-slate-700">
                        {formatMetricNumber(post.savesCount)}
                      </td>

                      {/* Impressions */}
                      <td className="py-3 px-3 text-slate-700">
                        {formatMetricNumber(post.impressions)}
                      </td>

                      {/* Reach */}
                      <td className="py-3 px-3 text-slate-700">
                        {formatMetricNumber(post.reach)}
                      </td>

                      {/* Engagement Rate */}
                      <td className="py-3 px-3">
                        {post.engagementRate != null ? (
                          <span className="font-semibold text-indigo-600 font-mono">
                            {(post.engagementRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Direct Post Link */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {post.externalPostUrl ? (
                          <a
                            href={post.externalPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                            title="Open original post on platform"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3 px-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{posts.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> posts
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
