import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
    .regex(/[\d\W]/, 'Must contain at least 1 number or special character'),
});

const workspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric characters and hyphens')
    .optional()
    .or(z.literal('')),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

const selectAccountsSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
  selectedAccounts: z
    .array(
      z.object({
        providerAccountId: z.string().min(1),
        provider: z.enum(['META_FACEBOOK', 'META_INSTAGRAM']),
        accountType: z.enum(['FACEBOOK_PAGE', 'INSTAGRAM_BUSINESS', 'INSTAGRAM_CREATOR']),
      }),
    )
    .min(1, 'Must select at least one account'),
});

describe('Frontend Form Validation Schemas', () => {
  describe('Login Validation', () => {
    it('should validate valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });
  });

  describe('Registration Validation', () => {
    it('should pass strong compliant registration data', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@company.com',
        password: 'SecurePassword123!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'jane@company.com',
        password: 'SecurePassword123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password with less than 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@company.com',
        password: 'Pass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('at least 8 characters'))).toBe(true);
      }
    });

    it('should reject password lacking uppercase letter', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@company.com',
        password: 'password123!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Workspace Validation', () => {
    it('should accept valid workspace creation payload', () => {
      const result = workspaceSchema.safeParse({
        name: 'Acme Digital Agency',
        slug: 'acme-digital',
        websiteUrl: 'https://acme.agency',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug characters', () => {
      const result = workspaceSchema.safeParse({
        name: 'Acme Digital',
        slug: 'Acme Digital!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid website URL', () => {
      const result = workspaceSchema.safeParse({
        name: 'Acme Digital',
        websiteUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Workspace Member Invitation Validation', () => {
    it('should accept valid invite payload', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'collaborator@agency.com',
        role: 'EDITOR',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'collaborator@agency.com',
        role: 'SUPER_ADMIN',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Social Account Selection Validation', () => {
    it('should accept valid account selection', () => {
      const result = selectAccountsSchema.safeParse({
        sessionToken: 'valid-session-token',
        selectedAccounts: [
          {
            providerAccountId: 'page-101',
            provider: 'META_FACEBOOK',
            accountType: 'FACEBOOK_PAGE',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty selected accounts array', () => {
      const result = selectAccountsSchema.safeParse({
        sessionToken: 'valid-session-token',
        selectedAccounts: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Brand Kit Form Validation', () => {
    const brandKitSchema = z.object({
      businessName: z.string().min(1, 'Business name is required').max(100),
      primaryColor: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code')
        .optional()
        .or(z.literal('')),
      secondaryColor: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code')
        .optional()
        .or(z.literal('')),
      websiteUrl: z
        .string()
        .url('Must be a valid URL')
        .regex(/^https?:\/\//, 'Must begin with http or https')
        .optional()
        .or(z.literal('')),
    });

    it('should accept valid brand kit configuration', () => {
      const result = brandKitSchema.safeParse({
        businessName: 'Om Artisanal Silks',
        primaryColor: '#800020',
        secondaryColor: '#FFD700',
        websiteUrl: 'https://omartisanal.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid primary color hex codes', () => {
      const result = brandKitSchema.safeParse({
        businessName: 'Test Brand',
        primaryColor: 'not-a-hex',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid website URL protocol', () => {
      const result = brandKitSchema.safeParse({
        businessName: 'Test Brand',
        websiteUrl: 'ftp://invalid-ftp.com',
      });
      // z.string().url() requires http/https in standard RFC
      const resultJs = brandKitSchema.safeParse({
        businessName: 'Test Brand',
        websiteUrl: 'javascript:alert(1)',
      });
      expect(resultJs.success).toBe(false);
    });
  });

  describe('AI Content Generation Form Validation', () => {
    const contentGenerationSchema = z.object({
      title: z.string().min(1, 'Title is required').max(200),
      objective: z.enum([
        'ENGAGEMENT',
        'SALES_LEADS',
        'ANNOUNCEMENT',
        'FESTIVAL_WISHES',
        'BRAND_AWARENESS',
        'EVENT_PROMOTION',
        'EDUCATIONAL',
        'RECRUITMENT',
      ]),
      platforms: z
        .array(z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TWITTER_X']))
        .min(1, 'Must select at least one platform')
        .max(4, 'Cannot select more than 4 platforms'),
      userInstructions: z.string().max(1000).optional(),
    });

    it('should accept valid multi-platform generation request', () => {
      const result = contentGenerationSchema.safeParse({
        title: 'Navratri Garba Launch',
        objective: 'FESTIVAL_WISHES',
        platforms: ['INSTAGRAM', 'FACEBOOK'],
        userInstructions: 'Highlight handcrafted Chaniya Cholis with festive blessings',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty platforms selection', () => {
      const result = contentGenerationSchema.safeParse({
        title: 'Navratri Garba Launch',
        objective: 'FESTIVAL_WISHES',
        platforms: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = contentGenerationSchema.safeParse({
        title: '',
        objective: 'ENGAGEMENT',
        platforms: ['INSTAGRAM'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Draft Rejection Workflow Validation', () => {
    const rejectDraftSchema = z.object({
      rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
    });

    it('should accept valid rejection reason', () => {
      const result = rejectDraftSchema.safeParse({
        rejectionReason: 'Please refine the call to action and discount expiry.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty rejection reason', () => {
      const result = rejectDraftSchema.safeParse({
        rejectionReason: '  ',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Bulk Multi-Account Campaign Publish Validation', () => {
    const bulkPublishSchema = z.object({
      draftIds: z.array(z.string().min(1)).min(1, 'Select at least one approved campaign'),
      socialAccountIds: z.array(z.string().min(1)).min(1, 'Select at least one connected account'),
      dispatchMode: z.enum(['IMMEDIATE', 'SCHEDULED', 'STAGGERED']),
      staggerMinutes: z.number().int().min(1).max(1440).optional(),
    });

    it('should validate valid immediate bulk publish payload across multiple accounts', () => {
      const result = bulkPublishSchema.safeParse({
        draftIds: ['draft-1', 'draft-2'],
        socialAccountIds: ['acc-ig', 'acc-fb', 'acc-pin', 'acc-yt', 'acc-tt', 'acc-threads'],
        dispatchMode: 'IMMEDIATE',
      });
      expect(result.success).toBe(true);
    });

    it('should reject bulk publish payload with no drafts or no accounts', () => {
      const result = bulkPublishSchema.safeParse({
        draftIds: [],
        socialAccountIds: [],
        dispatchMode: 'IMMEDIATE',
      });
      expect(result.success).toBe(false);
    });

    it('should validate staggered bulk publish payload with interval', () => {
      const result = bulkPublishSchema.safeParse({
        draftIds: ['draft-1'],
        socialAccountIds: ['acc-1', 'acc-2'],
        dispatchMode: 'STAGGERED',
        staggerMinutes: 15,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid dispatch mode', () => {
      const result = bulkPublishSchema.safeParse({
        draftIds: ['draft-1'],
        socialAccountIds: ['acc-1'],
        dispatchMode: 'INVALID_MODE',
      });
      expect(result.success).toBe(false);
    });
  });
});

