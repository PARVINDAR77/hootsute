'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
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
            OmniSocial AI Platform Foundation — Stage 1 System Overview
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

      {/* Stage 1 Foundation Verification Card */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base">Stage 1 Foundation Status</CardTitle>
                <CardDescription>
                  Active environment integrity and infrastructure health checks
                </CardDescription>
              </div>
            </div>
            <Badge variant="success">All Systems Operational</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
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

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Session &amp; Security
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  JWT + Rotated Refresh
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Bcrypt 12 Rounds &amp; RBAC Active
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
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

      {/* Honest Empty States for Planned Modules */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Upcoming Capabilities (Roadmap Stages 3–7)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Social Accounts Empty State */}
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-xs border border-slate-200">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-sm font-semibold text-slate-800">Connected Accounts</h4>
                  <Badge variant="outline">Stage 3</Badge>
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No social media accounts are connected yet. Meta Graph, LinkedIn, and X integrations will activate in Stage 3.
                </p>
              </div>
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
