'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Building2, Globe, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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
  websiteUrl: z.string().url('Please enter a valid URL (e.g. https://company.com)').optional().or(z.literal('')),
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
    watch,
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
    // Auto-generate slug if not manually customized
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
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Failed to create workspace. Please check the details entered.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Your Business Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Set up an isolated workspace for your brand, agency, or team. You will be assigned the OWNER role.
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 border-slate-200/80">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Workspace Description (Optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Briefly describe what this workspace will manage..."
                  {...register('description')}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
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

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Tenant Data Isolation &amp; RBAC Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
