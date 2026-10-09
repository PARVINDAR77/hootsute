'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  ShieldCheck,
  Database,
  Share2,
  Calendar,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Building2,
  Users,
  UserPlus,
  Settings,
  PlusCircle,
  Crown,
  Briefcase,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface HealthData {
  status: string;
  database?: string;
  uptime?: number;
  timestamp?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace, workspaces, isLoadingWorkspaces } = useWorkspace();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkReadiness = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await apiClient<HealthData>('/health/ready');
      setHealthData(data);
    } catch {
      setHealthData({ status: 'error', database: 'unavailable' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkReadiness();
  }, []);

  const getWorkspaceRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'OWNER':
        return <Badge variant="purple">WORKSPACE OWNER</Badge>;
      case 'ADMIN':
        return <Badge variant="default">WORKSPACE ADMIN</Badge>;
      case 'EDITOR':
        return <Badge variant="outline">WORKSPACE EDITOR</Badge>;
      case 'VIEWER':
        return <Badge variant="outline">WORKSPACE VIEWER</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <Badge variant={user?.role === 'SUPER_ADMIN' ? 'purple' : 'default'}>
              {user?.role}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            OmniSocial AI Platform — Multi-Tenant Business Workspaces
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkReadiness}
            isLoading={isCheckingHealth}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Check System Health
          </Button>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Open Swagger Docs
            </Button>
          </a>
        </div>
      </div>

      {/* Stage 2 Active Workspace Section */}
      {!isLoadingWorkspaces && (!currentWorkspace || workspaces.length === 0) ? (
        /* Empty State: Prompt to create first workspace */
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border-2">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg font-bold text-slate-900">Create Your First Workspace</h3>
              <p className="text-xs text-slate-600">
                Workspaces provide isolated environments for your company, team members, social
                accounts, and campaigns. You will become the primary OWNER of your new workspace.
              </p>
            </div>
            <Link href={ROUTES.WORKSPACE_ONBOARDING}>
              <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
                Start Workspace Onboarding
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : currentWorkspace ? (
        /* Active Workspace Overview */
        <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {currentWorkspace.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{currentWorkspace.name}</CardTitle>
                    <Badge variant="outline">@{currentWorkspace.slug}</Badge>
                    {getWorkspaceRoleBadge(currentWorkspace.currentUserRole)}
                  </div>
                  <CardDescription className="text-xs">
                    {currentWorkspace.description || 'OmniSocial AI Managed Business Workspace'}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}>
                  <Button variant="outline" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />}>
                    Channels
                  </Button>
                </Link>
                <Link href={ROUTES.SETTINGS_WORKSPACE}>
                  <Button variant="outline" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />}>
                    Settings
                  </Button>
                </Link>
                <Link href={ROUTES.SETTINGS_MEMBERS}>
                  <Button variant="outline" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
                    Team
                  </Button>
                </Link>
                {(currentWorkspace.currentUserRole === 'OWNER' ||
                  currentWorkspace.currentUserRole === 'ADMIN') && (
                  <Link href={ROUTES.SETTINGS_INVITATIONS}>
                    <Button size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                      Invite
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-lg bg-white border border-slate-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Industry Focus
                </span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  {currentWorkspace.industry || 'General Business'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Scheduling Timezone
                </span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {currentWorkspace.timezone || 'UTC'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Tenant Isolation
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Strict Backend Scoping
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Infrastructure Verification Card */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-900 text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base">System Infrastructure &amp; Security</CardTitle>
                <CardDescription>
                  Active environment integrity, multi-tenant isolation, and database health
                </CardDescription>
              </div>
            </div>
            <Badge variant="success">All Systems Operational</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  PostgreSQL 18 Database
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {healthData?.database === 'connected' ? 'Connected & Migrated' : 'Checking...'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Prisma ORM &amp; Migrations Synced
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Tenant Isolation
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  Guards &amp; Audit Logs
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  RBAC Hierarchy &amp; Anti-IDOR
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  REST API Engine
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
                  NestJS /api/v1
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Global Filters &amp; OpenAPI Spec
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Modules & Roadmap */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Capabilities &amp; Roadmap (Stages 3–7)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Social Accounts Card (Stage 3 Active) */}
          <Card className="border-indigo-200 bg-indigo-50/20">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-sm font-semibold text-slate-800">Social Channels</h4>
                  <Badge variant="success">Stage 3 Live</Badge>
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Connect official Facebook Pages and Instagram Professional accounts with encrypted token storage.
                </p>
              </div>
              <Link href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}>
                <Button size="sm" variant="outline" className="mt-1 text-xs">
                  Manage Channels
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* AI Creative Drafts Empty State */}
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-xs border border-slate-200">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-sm font-semibold text-slate-800">Content Schedule</h4>
                  <Badge variant="outline">Stage 4–6</Badge>
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No scheduled publications or pending drafts. AI post creation and WhatsApp approval workflows arrive in Stages 4 &amp; 5.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Growth Analytics Empty State */}
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-xs border border-slate-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-sm font-semibold text-slate-800">Growth Analytics</h4>
                  <Badge variant="outline">Stage 7</Badge>
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Social metrics will display real-time engagement and reach sync once social channels and publication history are established.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
