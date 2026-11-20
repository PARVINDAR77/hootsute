'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Building2, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

const workspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens only')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  websiteUrl: z
    .string()
    .url('Please enter a valid URL (e.g. https://company.com)')
    .optional()
    .or(z.literal('')),
  timezone: z.string().default('UTC'),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export default function WorkspaceOnboardingPage() {
  const { createWorkspace } = useWorkspace();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      industry: '',
      websiteUrl: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val, { shouldValidate: true });
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue('slug', autoSlug, { shouldValidate: false });
  };

  const onSubmit = async (data: WorkspaceFormData) => {
    setServerError(null);
    try {
      await createWorkspace({
        name: data.name,
        slug: data.slug ? data.slug : undefined,
        description: data.description,
        industry: data.industry,
        websiteUrl: data.websiteUrl || undefined,
        timezone: data.timezone,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      setServerError(err.message || 'Failed to create workspace. Please check the details entered.');
    }
  };

  return (
    <div className="min-h-screen ambient-canvas flex flex-col py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between mb-8">
        <Link href={ROUTES.DASHBOARD} className="group">
          <BrandLogo />
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto">
        <div className="text-center mb-8 space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-xs font-bold">
            Workspace Onboarding
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">
            Create Your Business <span className="text-gradient">Workspace</span>
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
            Set up an isolated multi-tenant workspace for your brand, agency, or team. You will be
            assigned the OWNER role.
          </p>
        </div>

        <Card variant="glow" className="shadow-elevated">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {serverError && <Alert type="error" message={serverError} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Workspace / Business Name"
                placeholder="e.g. Acme Marketing Agency"
                leftIcon={<Building2 className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name', { onChange: handleNameChange })}
              />

              <Input
                label="Workspace URL Slug"
                placeholder="e.g. acme-marketing"
                helperText="Unique identifier for URLs and team invitations (lowercase, hyphens)"
                error={errors.slug?.message}
                {...register('slug')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Industry"
                  placeholder="e.g. E-Commerce, Agency"
                  error={errors.industry?.message}
                  {...register('industry')}
                />

                <Input
                  label="Business Timezone"
                  placeholder="e.g. America/New_York"
                  error={errors.timezone?.message}
                  {...register('timezone')}
                />
              </div>

              <Input
                label="Company Website (Optional)"
                placeholder="https://example.com"
                leftIcon={<Globe className="w-4 h-4" />}
                error={errors.websiteUrl?.message}
                {...register('websiteUrl')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300">
                  Workspace Description (Optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-[#E7EAF2] dark:border-[#1E2749] bg-white dark:bg-[#0B1024] px-3.5 py-2.5 text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7138F5]/20 focus:border-[#7138F5]"
                  placeholder="Briefly describe what this workspace will manage..."
                  {...register('description')}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Workspace &amp; Launch
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-[#64748B] dark:text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Tenant Data Isolation &amp; RBAC Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
