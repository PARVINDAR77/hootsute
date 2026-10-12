'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  GeneratedExecutiveReportDto,
  ExecutiveReportScheduleDto,
  ReportFrequency,
  GenerateReportRequestDto,
  CreateReportScheduleDto,
} from '@packages/shared';
import {
  PieChart,
  FileSpreadsheet,
  Calendar,
  Clock,
  Plus,
  Mail,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Printer,
  X,
  Share2,
  TrendingUp,
  MousePointerClick,
  Radio,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export default function ExecutiveReportsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [activeTab, setActiveTab] = useState<'reports' | 'schedules'>('reports');
  const [reports, setReports] = useState<GeneratedExecutiveReportDto[]>([]);
  const [schedules, setSchedules] = useState<ExecutiveReportScheduleDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & Drawers
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [viewingReport, setViewingReport] = useState<GeneratedExecutiveReportDto | null>(null);

  // Generate Form State
  const [genTitle, setGenTitle] = useState<string>('');
  const [genPeriodDays, setGenPeriodDays] = useState<number>(7);
  const [genRecipients, setGenRecipients] = useState<string>('');
  const [genIncludeSocial, setGenIncludeSocial] = useState<boolean>(true);
  const [genIncludeLinks, setGenIncludeLinks] = useState<boolean>(true);
  const [genIncludeListening, setGenIncludeListening] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Schedule Form State
  const [schName, setSchName] = useState<string>('');
  const [schFrequency, setSchFrequency] = useState<ReportFrequency>(ReportFrequency.WEEKLY);
  const [schRecipients, setSchRecipients] = useState<string>('');
  const [schIncludeSocial, setSchIncludeSocial] = useState<boolean>(true);
  const [schIncludeLinks, setSchIncludeLinks] = useState<boolean>(true);
  const [schIncludeListening, setSchIncludeListening] = useState<boolean>(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [reportsRes, schedulesRes] = await Promise.all([
        apiClient<any>(`workspaces/${workspaceId}/reports/history`),
        apiClient<any>(`workspaces/${workspaceId}/reports/schedules`),
      ]);
      setReports(reportsRes.data ?? reportsRes ?? []);
      setSchedules(schedulesRes.data ?? schedulesRes ?? []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load executive reports data');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setIsGenerating(true);
    setErrorMsg(null);

    const recipientsList = genRecipients
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const payload: GenerateReportRequestDto = {
      title: genTitle.trim() || undefined,
      periodDays: genPeriodDays,
      recipients: recipientsList.length > 0 ? recipientsList : undefined,
      includeSocial: genIncludeSocial,
      includeLinks: genIncludeLinks,
      includeListening: genIncludeListening,
    };

    try {
      const res = await apiClient<any>(`workspaces/${workspaceId}/reports/generate`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newReport: GeneratedExecutiveReportDto = res.data ?? res;
      setReports([newReport, ...reports]);
      setIsGenerateModalOpen(false);
      setViewingReport(newReport);
      // Reset form
      setGenTitle('');
      setGenRecipients('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to synthesize report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    const recipientsList = schRecipients
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (recipientsList.length === 0) {
      setErrorMsg('Please specify at least one recipient email address');
      return;
    }

    setIsSavingSchedule(true);
    setErrorMsg(null);

    const payload: CreateReportScheduleDto = {
      name: schName.trim(),
      frequency: schFrequency,
      recipients: recipientsList,
      includeSocial: schIncludeSocial,
      includeLinks: schIncludeLinks,
      includeListening: schIncludeListening,
      isActive: true,
    };

    try {
      const res = await apiClient<any>(`workspaces/${workspaceId}/reports/schedules`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newSchedule: ExecutiveReportScheduleDto = res.data ?? res;
      setSchedules([newSchedule, ...schedules]);
      setIsScheduleModalOpen(false);
      setSchName('');
      setSchRecipients('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to configure schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!workspaceId) return;
    if (!confirm('Are you sure you want to delete this executive report?')) return;

    try {
      await apiClient(`workspaces/${workspaceId}/reports/history/${reportId}`, {
        method: 'DELETE',
      });
      setReports(reports.filter((r) => r.id !== reportId));
      if (viewingReport?.id === reportId) setViewingReport(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete report');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!workspaceId) return;
    if (!confirm('Are you sure you want to cancel this automated report schedule?')) return;

    try {
      await apiClient(`workspaces/${workspaceId}/reports/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      setSchedules(schedules.filter((s) => s.id !== scheduleId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete schedule');
    }
  };

  // KPI Calculations
  const totalReportsCount = reports.length;
  const activeSchedulesCount = schedules.filter((s) => s.isActive).length;
  const totalImpressionsAudited = reports.reduce(
    (acc, r) => acc + (r.metricsSummary?.totalImpressions || 0),
    0,
  );
  const totalAuditedClicks = reports.reduce(
    (acc, r) => acc + (r.metricsSummary?.totalLinkClicks || 0),
    0,
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Reports &amp; Automation</h1>
            <Badge variant="purple">Agency Suite</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automate C-level PDF and HTML briefs across social reach, ROI link attribution, and brand listening.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Clock className="w-4 h-4 mr-1.5 text-indigo-600" />
            New Schedule
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsGenerateModalOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Generate On-Demand
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert variant="error" title="Report System Notice">
          {errorMsg}
        </Alert>
      )}

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Reports Synthesized</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalReportsCount}</p>
          <span className="text-[11px] text-slate-400">Available in archive</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Schedules</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeSchedulesCount}</p>
          <span className="text-[11px] text-slate-400">Recurring automated dispatches</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Impressions Audited</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalImpressionsAudited.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Multi-network aggregate</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Attributed Clicks</span>
            <MousePointerClick className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalAuditedClicks.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">UTM campaign tracking</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Reports Archive ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schedules'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Automated Schedules ({schedules.length})
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading reports and schedule configurations...
        </div>
      ) : activeTab === 'reports' ? (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Executive Reports Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Generate your first comprehensive executive brief or configure an automated schedule to deliver periodic updates.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Synthesize First Report
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {report.title}
                      </h4>
                      <Badge variant="default">
                        {report.frequency}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Period: {new Date(report.periodStart).toLocaleDateString()} &ndash;{' '}
                      {new Date(report.periodEnd).toLocaleDateString()}
                    </div>

                    {/* Metric Chips */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-slate-100 text-center">
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Impressions
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {report.metricsSummary?.totalImpressions?.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Reach
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {report.metricsSummary?.totalReach?.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Clicks
                        </span>
                        <span className="text-xs font-bold text-indigo-600">
                          {report.metricsSummary?.totalLinkClicks?.toLocaleString() ?? 0}
                        </span>
                      </div>
                    </div>

                    {report.recipientsSent?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sent to {report.recipientsSent.length} recipient(s)</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setViewingReport(report)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Report
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 space-y-3">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Automated Schedules Configured</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Schedule recurring executive reports sent directly to your stakeholders every week or month.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsScheduleModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Configure New Schedule
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Schedule Name</th>
                    <th className="py-3 px-4">Cadence</th>
                    <th className="py-3 px-4">Stakeholders</th>
                    <th className="py-3 px-4">Domains Included</th>
                    <th className="py-3 px-4">Next Run</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {sch.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="default">{sch.frequency}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {sch.recipients.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex gap-1.5">
                          {sch.includeSocial && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Social</span>}
                          {sch.includeLinks && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Links</span>}
                          {sch.includeListening && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Sentiment</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {sch.nextRunAt ? new Date(sch.nextRunAt).toLocaleDateString() : 'Pending'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(sch.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Generate Report Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Synthesize Executive Report</h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Title (Optional)
                </label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. Q2 Omnichannel Performance Audit"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lookback Review Window
                </label>
                <select
                  value={genPeriodDays}
                  onChange={(e) => setGenPeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={7}>Last 7 Days (Weekly Review)</option>
                  <option value={14}>Last 14 Days (Bi-Weekly Review)</option>
                  <option value={30}>Last 30 Days (Monthly Audit)</option>
                  <option value={90}>Last 90 Days (Quarterly Executive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Stakeholder Emails (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={genRecipients}
                  onChange={(e) => setGenRecipients(e.target.value)}
                  placeholder="cmo@client.com, exec@agency.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <span className="block text-xs font-semibold text-slate-700">Metrics Domains to Include</span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genIncludeSocial}
                    onChange={(e) => setGenIncludeSocial(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Social Account Impressions, Reach &amp; Top Published Posts</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genIncludeLinks}
                    onChange={(e) => setGenIncludeLinks(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Shortened Link Tracking &amp; Conversion Attribution</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genIncludeListening}
                    onChange={(e) => setGenIncludeListening(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Brand Listening Mentions &amp; Sentiment Polarity</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Synthesizing...' : 'Generate Executive Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Configuration Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">New Automated Report Schedule</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={schName}
                  onChange={(e) => setSchName(e.target.value)}
                  required
                  placeholder="e.g. Weekly Client Leadership Brief"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Frequency
                </label>
                <select
                  value={schFrequency}
                  onChange={(e) => setSchFrequency(e.target.value as ReportFrequency)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={ReportFrequency.WEEKLY}>Weekly (Every 7 Days)</option>
                  <option value={ReportFrequency.MONTHLY}>Monthly (Every 30 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Stakeholder Emails <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={schRecipients}
                  onChange={(e) => setSchRecipients(e.target.value)}
                  required
                  placeholder="stakeholder@client.com, exec@agency.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Separate multiple emails with commas</p>
              </div>

              <div className="space-y-2 pt-1">
                <span className="block text-xs font-semibold text-slate-700">Metrics Domains</span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schIncludeSocial}
                    onChange={(e) => setSchIncludeSocial(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Social Account Impressions &amp; Content</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schIncludeLinks}
                    onChange={(e) => setSchIncludeLinks(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Shortened Link Attribution</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schIncludeListening}
                    onChange={(e) => setSchIncludeListening(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Brand Sentiment Monitoring</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSavingSchedule}
                >
                  {isSavingSchedule ? 'Saving...' : 'Activate Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Viewer Full Drawer / Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{viewingReport.title}</h3>
                <span className="text-xs text-slate-500">
                  Synthesized on {new Date(viewingReport.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const iframe = document.getElementById('report-frame') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.print();
                    }
                  }}
                >
                  <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
                  Print / Save PDF
                </Button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded HTML Report Frame */}
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
              <iframe
                id="report-frame"
                srcDoc={viewingReport.htmlContent}
                title={viewingReport.title}
                className="w-full h-full rounded-xl bg-white border border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
