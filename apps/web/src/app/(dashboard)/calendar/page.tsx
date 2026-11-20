'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  ScheduledPostDto,
  ScheduledPostStatus,
  SocialPlatform,
  PublishTargetStatus,
} from '@packages/shared';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Filter,
  Search,
  Globe,
  Share2,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  List,
  Grid,
  CalendarDays,
  Loader2,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  getMonthMatrix,
  getWeekDays,
  formatDateKey,
  formatTime,
  formatShortDate,
  formatFullDateTime,
  isToday,
  isSameDay,
  STATUS_UI_CONFIG,
} from '@/lib/calendar-utils';
import { SchedulePostModal } from '@/components/calendar/SchedulePostModal';
import { PostInspectorModal } from '@/components/calendar/PostInspectorModal';
import { BulkScheduleModal } from '@/components/calendar/BulkScheduleModal';

type CalendarViewMode = 'month' | 'week' | 'list';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  // View state
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('UTC');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [posts, setPosts] = useState<ScheduledPostDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [preselectedDraftId, setPreselectedDraftId] = useState<string | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);

  const [selectedPostForInspection, setSelectedPostForInspection] =
    useState<ScheduledPostDto | null>(null);

  // Initialize timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      setTimezone('UTC');
    }
  }, []);

  // Handle URL query param: ?scheduleDraftId=...
  useEffect(() => {
    const draftIdFromUrl = searchParams.get('scheduleDraftId');
    if (draftIdFromUrl) {
      setPreselectedDraftId(draftIdFromUrl);
      setIsScheduleModalOpen(true);
    }
  }, [searchParams]);

  // Compute date range for query based on view mode and currentDate
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      // Month view needs padding of previous and next month
      const firstOfMonth = new Date(year, month, 1);
      const startDay = firstOfMonth.getDay();
      const start = new Date(year, month, 1 - startDay);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 42); // 6 full weeks
      end.setHours(23, 59, 59, 999);

      return { start, end };
    } else if (viewMode === 'week') {
      const current = new Date(currentDate);
      const day = current.getDay();
      const start = new Date(current);
      start.setDate(current.getDate() - day);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    } else {
      // List view: 30 days before and 60 days ahead
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - 30);
      start.setHours(0, 0, 0, 0);

      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + 60);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }
  }, [currentDate, viewMode]);

  // Fetch calendar posts
  const fetchCalendarPosts = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const queryParams = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        timezone,
      });

      const response = await apiClient<any>(
        `/workspaces/${workspaceId}/scheduled-posts/calendar?${queryParams.toString()}`,
      );

      const list: ScheduledPostDto[] = Array.isArray(response)
        ? response
        : response?.data || [];
      setPosts(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load scheduled posts for calendar');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, dateRange, timezone]);

  useEffect(() => {
    fetchCalendarPosts();
  }, [fetchCalendarPosts]);

  // Filter posts client-side
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'AMBIGUOUS_TIMEOUT') {
          const hasTimeout = post.targets?.some(
            (t) => t.status === PublishTargetStatus.AMBIGUOUS_TIMEOUT,
          );
          if (!hasTimeout && post.status !== ScheduledPostStatus.FAILED) return false;
        } else if (post.status !== statusFilter) {
          return false;
        }
      }

      // Platform filter
      if (platformFilter !== 'ALL') {
        const matchesPlatform = post.targets?.some(
          (t) => t.platform === platformFilter,
        );
        if (!matchesPlatform) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (post.draft?.title || post.contentSnapshot?.title || '').toLowerCase().includes(q);
        const accountMatch = post.targets?.some((t) =>
          (t.socialAccount?.accountName || t.platform || '').toLowerCase().includes(q),
        );
        if (!titleMatch && !accountMatch) return false;
      }

      return true;
    });
  }, [posts, statusFilter, platformFilter, searchQuery]);

  // Group posts by dateKey (YYYY-MM-DD)
  const postsByDateKey = useMemo(() => {
    const map = new Map<string, ScheduledPostDto[]>();
    filteredPosts.forEach((post) => {
      const date = new Date(post.scheduledAt);
      const key = formatDateKey(date);
      const existing = map.get(key) || [];
      existing.push(post);
      map.set(key, existing);
    });
    return map;
  }, [filteredPosts]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setMonth(next.getMonth() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open schedule modal for specific day
  const handleDayClickToSchedule = (date: Date) => {
    setPreselectedDate(date);
    setPreselectedDraftId(null);
    setIsScheduleModalOpen(true);
  };

  // Format header period title
  const periodTitle = useMemo(() => {
    if (viewMode === 'month') {
      return new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
      }).format(currentDate);
    } else if (viewMode === 'week') {
      const start = dateRange.start;
      const end = new Date(dateRange.start);
      end.setDate(end.getDate() + 6);
      return `${formatShortDate(start.toISOString())} – ${formatShortDate(end.toISOString(), undefined)}, ${start.getFullYear()}`;
    } else {
      return `Agenda (Next 60 Days)`;
    }
  }, [viewMode, currentDate, dateRange]);

  // Metric counts
  const stats = useMemo(() => {
    let scheduled = 0;
    let publishing = 0;
    let published = 0;
    let failed = 0;

    posts.forEach((p) => {
      if (p.status === ScheduledPostStatus.SCHEDULED) scheduled++;
      else if (p.status === ScheduledPostStatus.PROCESSING) publishing++;
      else if (p.status === ScheduledPostStatus.PUBLISHED) published++;
      else if (
        p.status === ScheduledPostStatus.FAILED ||
        p.targets?.some((t) => t.status === PublishTargetStatus.AMBIGUOUS_TIMEOUT)
      ) {
        failed++;
      }
    });

    return { scheduled, publishing, published, failed };
  }, [posts]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Publishing Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate, schedule, and track automated multi-platform social media publishing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsBulkModalOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
            id="btn-open-bulk-import"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Bulk CSV Import</span>
          </Button>
          <Button
            onClick={() => {
              setPreselectedDate(null);
              setPreselectedDraftId(null);
              setIsScheduleModalOpen(true);
            }}
            size="sm"
            className="flex items-center gap-2 shadow-xs"
            id="btn-schedule-post"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              Upcoming Scheduled
            </span>
            <div className="text-xl font-extrabold text-[#111827] dark:text-white mt-0.5">{stats.scheduled}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              In Dispatch
            </span>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.publishing}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <RotateCw className="w-5 h-5 animate-spin" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              Published
            </span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.published}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              Needs Attention
            </span>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{stats.failed}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Calendar Controls & Filter Toolbar */}
      <div className="bg-white dark:bg-[#0F142B]/90 rounded-2xl border border-[#E7EAF2] dark:border-[#1E2749] p-4 shadow-soft dark:shadow-none space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Month/Week Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-slate-100 text-slate-600 transition"
                title="Previous Period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border-x border-slate-200 transition"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-slate-100 text-slate-600 transition"
                title="Next Period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-slate-900 tracking-tight">{periodTitle}</h2>
          </div>

          {/* Right: View Switcher & Timezone */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium truncate max-w-[120px]">{timezone}</span>
            </div>

            {/* View Mode Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'month'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>

              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'week'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Week</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PROCESSING">In Dispatch / Processing</option>
              <option value="PUBLISHED">Published</option>
              <option value="FAILED">Failed</option>
              <option value="AMBIGUOUS_TIMEOUT">Needs Reconciliation</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Platform:</span>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Platforms</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="TWITTER">X / Twitter</option>
            </select>
          </div>

          {/* Search query */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scheduled posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchCalendarPosts}
            disabled={isLoading}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
            title="Refresh Calendar"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <Alert variant="danger">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </Alert>
      )}

      {/* Main Views */}
      {isLoading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Loading scheduled posts...</span>
        </div>
      ) : viewMode === 'month' ? (
        /* ================= MONTH VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Matrix Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth()).map((daySlot) => {
              const dayPosts = postsByDateKey.get(daySlot.dateKey) || [];

              return (
                <div
                  key={daySlot.dateKey}
                  className={`min-h-[110px] p-2 flex flex-col transition group relative ${
                    daySlot.isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                  } ${daySlot.isToday ? 'bg-indigo-50/20' : ''}`}
                >
                  {/* Day Header inside cell */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                        daySlot.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : daySlot.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {daySlot.dayNumber}
                    </span>

                    {/* Quick Schedule Button on hover */}
                    <button
                      onClick={() => handleDayClickToSchedule(daySlot.date)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center transition"
                      title="Schedule on this date"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Scheduled Posts in Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayPosts.slice(0, 3).map((post) => {
                      const statusUi = STATUS_UI_CONFIG[post.status] || {
                        bg: 'bg-slate-100',
                        text: 'text-slate-700',
                        border: 'border-slate-200',
                        dot: 'bg-slate-400',
                      };

                      const primaryPlatform = post.targets?.[0]?.platform;
                      const isIg = primaryPlatform === SocialPlatform.INSTAGRAM;

                      return (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPostForInspection(post)}
                          className={`w-full text-left p-1 rounded-md text-[11px] font-medium border ${statusUi.bg} ${statusUi.border} flex items-center gap-1.5 hover:shadow-xs transition truncate`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusUi.dot}`} />
                          <span className="font-semibold text-slate-700 shrink-0">
                            {formatTime(post.scheduledAt, timezone)}
                          </span>
                          {isIg ? (
                            <Instagram className="w-3 h-3 text-pink-600 shrink-0" />
                          ) : (
                            <Facebook className="w-3 h-3 text-blue-600 shrink-0" />
                          )}
                          <span className="truncate text-slate-800">
                            {post.draft?.title || post.contentSnapshot?.title || 'Draft'}
                          </span>
                        </button>
                      );
                    })}

                    {dayPosts.length > 3 && (
                      <div className="text-[10px] text-slate-500 font-semibold px-1">
                        +{dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        /* ================= WEEK VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 divide-x divide-slate-100">
            {getWeekDays(currentDate).map((daySlot) => {
              const dayPosts = postsByDateKey.get(daySlot.dateKey) || [];

              return (
                <div key={daySlot.dateKey} className="flex flex-col min-h-[380px]">
                  {/* Day header */}
                  <div
                    className={`p-3 text-center border-b border-slate-100 ${
                      daySlot.isToday ? 'bg-indigo-50/50' : 'bg-slate-50/70'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(daySlot.date)}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        daySlot.isToday ? 'bg-indigo-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {daySlot.dayNumber}
                    </div>
                  </div>

                  {/* Day Cards list */}
                  <div className="flex-1 p-2 space-y-2 bg-slate-50/20 overflow-y-auto">
                    {dayPosts.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-400">
                        No scheduled posts
                      </div>
                    ) : (
                      dayPosts.map((post) => {
                        const statusUi = STATUS_UI_CONFIG[post.status] || {
                          bg: 'bg-slate-100',
                          text: 'text-slate-700',
                          border: 'border-slate-200',
                          dot: 'bg-slate-400',
                        };

                        return (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPostForInspection(post)}
                            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs cursor-pointer transition space-y-2"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatTime(post.scheduledAt, timezone)}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold border ${statusUi.bg} ${statusUi.text} ${statusUi.border}`}
                              >
                                {post.status}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                              {post.draft?.title || post.contentSnapshot?.title || 'Draft'}
                            </p>

                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                              <Share2 className="w-3 h-3 text-slate-400" />
                              <span>{post.targets?.length || 0} target accounts</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= LIST / AGENDA VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Scheduled Posts Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no scheduled social posts matching your filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPosts.map((post) => {
                const statusUi = STATUS_UI_CONFIG[post.status] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                  dot: 'bg-slate-400',
                  label: post.status,
                };

                return (
                  <div
                    key={post.id}
                    className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100">
                        <Clock className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusUi.bg} ${statusUi.text} ${statusUi.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusUi.dot}`} />
                            {statusUi.label}
                          </span>

                          <span className="text-xs text-slate-500 font-medium">
                            {formatFullDateTime(post.scheduledAt, timezone)}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {post.draft?.title || post.contentSnapshot?.title || 'Untitled Draft'}
                        </h3>

                        {/* Targets preview */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Targets:</span>
                          {post.targets?.map((target) => (
                            <span
                              key={target.id}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                            >
                              {target.platform === SocialPlatform.INSTAGRAM ? (
                                <Instagram className="w-3 h-3 text-pink-600" />
                              ) : (
                                <Facebook className="w-3 h-3 text-blue-600" />
                              )}
                              <span>
                                {target.socialAccount?.accountName || target.platform}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPostForInspection(post)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule Post Modal */}
      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setPreselectedDraftId(null);
          setPreselectedDate(null);
        }}
        onScheduled={(newPost) => {
          fetchCalendarPosts();
        }}
        preselectedDraftId={preselectedDraftId}
        preselectedDate={preselectedDate}
      />

      {/* Post Inspector Modal */}
      <PostInspectorModal
        post={selectedPostForInspection}
        isOpen={selectedPostForInspection !== null}
        onClose={() => setSelectedPostForInspection(null)}
        onPostUpdated={() => {
          fetchCalendarPosts();
          setSelectedPostForInspection(null);
        }}
      />

      {/* Bulk CSV Schedule Modal */}
      <BulkScheduleModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => fetchCalendarPosts()}
      />
    </div>
  );
}
