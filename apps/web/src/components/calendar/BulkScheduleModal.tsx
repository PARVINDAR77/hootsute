'use client';

import React, { useState, useRef } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, ApiError } from '@/lib/api-client';
import {
  BulkScheduleValidationResponse,
  BulkScheduleValidationRowResult,
  BulkScheduleImportResponse,
  SocialPlatform,
} from '@packages/shared';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  FileText,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkScheduleModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkScheduleModalProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  // Validation state
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<BulkScheduleValidationResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<BulkScheduleImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle template download
  const handleDownloadTemplate = async () => {
    if (!workspaceId) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('omnisocial_token') : null;

      const response = await fetch(`${apiUrl}/workspaces/${workspaceId}/bulk-schedule/template`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download CSV template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omnisocial_bulk_schedule_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setValidationError(err.message || 'Error downloading template');
    }
  };

  // Process File Reading
  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setValidationError('Please upload a valid .csv file');
      return;
    }

    setFileName(file.name);
    setValidationError(null);
    setValidationResult(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      triggerValidation(text);
    };
    reader.onerror = () => {
      setValidationError('Failed to read CSV file');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Run dry-run validation
  const triggerValidation = async (content: string) => {
    if (!workspaceId || !content.trim()) return;
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      const res = await apiClient<any>(
        `workspaces/${workspaceId}/bulk-schedule/validate`,
        {
          method: 'POST',
          body: JSON.stringify({ csvContent: content }),
        },
      );
      const valData: BulkScheduleValidationResponse = res.data || res;
      setValidationResult(valData);
    } catch (err: any) {
      setValidationError(err.message || 'Validation failed. Check CSV formatting.');
    } finally {
      setIsValidating(false);
    }
  };

  // Commit valid rows to scheduled calendar
  const handleCommitImport = async () => {
    if (!workspaceId || !validationResult) return;

    const validRows = validationResult.rows
      .filter((r) => r.isValid)
      .map((r) => r.data);

    if (validRows.length === 0) {
      setImportError('No valid rows available to schedule.');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const res = await apiClient<any>(
        `workspaces/${workspaceId}/bulk-schedule/import`,
        {
          method: 'POST',
          body: JSON.stringify({ rows: validRows }),
        },
      );

      const impData: BulkScheduleImportResponse = res.data || res;
      setImportResult(impData);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || 'Batch import failed. Please review errors and retry.');
    } finally {
      setIsImporting(false);
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.FACEBOOK:
        return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
      case SocialPlatform.INSTAGRAM:
        return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
      case SocialPlatform.LINKEDIN:
        return <Linkedin className="w-3.5 h-3.5 text-sky-700" />;
      case SocialPlatform.TWITTER_X:
        return <Twitter className="w-3.5 h-3.5 text-slate-800" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      id="bulk-schedule-modal"
      data-testid="bulk-schedule-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Bulk CSV Calendar Importer
                <Badge variant="purple" className="text-xs font-semibold bg-indigo-100/70 text-indigo-700 border-indigo-200">
                  Batch Schedule
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a structured CSV spreadsheet to schedule multiple multi-channel posts at once
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
              id="btn-download-csv-template"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Template
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
              id="btn-close-bulk-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Method Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload CSV File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Paste CSV Text
            </button>
          </div>

          {/* Upload Dropzone */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50/30'
              }`}
              id="csv-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                id="bulk-csv-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {fileName ? (
                    <span className="text-indigo-600 font-bold">{fileName}</span>
                  ) : (
                    'Click to upload or drag & drop CSV file'
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Standard RFC 4180 format. Supports Facebook, Instagram, LinkedIn, and Twitter/X.
                </p>
              </div>
            </div>
          )}

          {/* Paste CSV Text */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Paste raw CSV text (including header row)
              </label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`Scheduled Date,Timezone,Title,Caption,Platforms,Accounts,Media URLs,Hashtags\n"2026-10-15 14:00","UTC","Sample Post","Exciting new update!","FACEBOOK,LINKEDIN","","","#Product"`}
                rows={6}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                id="csv-textarea"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => triggerValidation(csvContent)}
                  disabled={isValidating || !csvContent.trim()}
                  className="flex items-center gap-1.5 text-xs"
                  id="btn-validate-pasted-csv"
                >
                  {isValidating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Validate Content
                </Button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {validationError && (
            <Alert variant="danger" className="text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </Alert>
          )}

          {/* Loading indicator */}
          {isValidating && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Validating posts, timestamps, and account limits...</span>
            </div>
          )}

          {/* Success Import Notification */}
          {importResult && (
            <Alert variant="success" className="bg-emerald-50 border-emerald-200 text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Successfully imported and scheduled {importResult.importedCount} post(s)!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Publishing calendar is updating automatically...
                </p>
              </div>
            </Alert>
          )}

          {importError && (
            <Alert variant="danger" className="text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </Alert>
          )}

          {/* Validation Report Table */}
          {validationResult && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                  <div className="text-lg font-bold text-slate-800">{validationResult.totalRows}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Valid & Ready</span>
                  <div className="text-lg font-bold text-emerald-700">{validationResult.validCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-600">Needs Attention</span>
                  <div className="text-lg font-bold text-rose-700">{validationResult.invalidCount}</div>
                </div>
              </div>

              {/* Rows List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {validationResult.rows.map((row) => (
                    <div
                      key={row.rowNumber}
                      className={`p-3 text-xs transition-colors ${
                        row.isValid ? 'bg-white hover:bg-slate-50/60' : 'bg-rose-50/30 hover:bg-rose-50/50'
                      }`}
                      data-testid={`bulk-row-${row.rowNumber}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400 text-[11px] w-6">
                            #{row.rowNumber}
                          </span>
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Error
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 ml-2">
                            {row.data.platforms.map((p) => (
                              <div
                                key={p}
                                className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center"
                                title={p}
                              >
                                {getPlatformIcon(p)}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{row.data.scheduledAt ? new Date(row.data.scheduledAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="mt-2 text-slate-700 line-clamp-2 pl-8 font-normal">
                        {row.data.caption}
                      </p>

                      {/* Target Accounts Preview */}
                      {row.targetAccounts && row.targetAccounts.length > 0 && (
                        <div className="mt-1.5 pl-8 flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="text-slate-400">Target Accounts:</span>
                          {row.targetAccounts.map((acc) => (
                            <span
                              key={acc.id}
                              className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            >
                              @{acc.username || acc.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Error & Warning Callouts */}
                      {row.errors.length > 0 && (
                        <div className="mt-2 pl-8 space-y-1">
                          {row.errors.map((err, i) => (
                            <div key={i} className="flex items-center gap-1 text-rose-600 text-[11px]">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {row.warnings.length > 0 && (
                        <div className="mt-1 pl-8 space-y-1">
                          {row.warnings.map((warn, i) => (
                            <div key={i} className="flex items-center gap-1 text-amber-600 text-[11px]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {validationResult && (
              <span>
                {validationResult.validCount} of {validationResult.totalRows} row(s) ready to schedule
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isImporting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCommitImport}
              disabled={
                isImporting ||
                isValidating ||
                !validationResult ||
                validationResult.validCount === 0 ||
                importResult !== null
              }
              className="flex items-center gap-2 text-xs shadow-xs"
              id="btn-confirm-bulk-import"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling Posts...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Schedule {validationResult ? `${validationResult.validCount} Valid Post(s)` : 'Posts'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
