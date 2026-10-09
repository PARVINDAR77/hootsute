export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'OmniSocial AI';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  SETTINGS_WORKSPACE: '/settings/workspace',
  SETTINGS_MEMBERS: '/settings/members',
  SETTINGS_INVITATIONS: '/settings/invitations',
  WORKSPACE_ONBOARDING: '/onboarding/workspace',
  INVITATIONS_ACCEPT: '/invitations/accept',
  UNAUTHORIZED: '/unauthorized',
};
