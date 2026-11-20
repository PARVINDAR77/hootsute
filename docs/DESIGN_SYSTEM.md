# OmniSocial AI — Futuristic Design System & Dual Theme Specification

> **Status:** Implemented & Verified (Phase 1)  
> **Primary Visual Target:** Futuristic 3D SaaS visual language with glassmorphic depth, restrained electric purple-to-cyan gradients, and dual Light (default) + Cosmic Dark themes.

---

## 1. Color System & Dual Themes

### Light Theme (Default)
| Token | CSS Variable / Tailwind Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| Primary Canvas | `--bg-primary` / `bg-surface-light` | `#F7F8FC` | Page canvas & ambient backdrop |
| Secondary Surface | `--bg-secondary` / `bg-surface-card` | `#FFFFFF` | Cards, panels, modals, dropdowns |
| Primary Text | `--text-primary` | `#111827` | Headings, metrics, primary labels |
| Secondary Text | `--text-secondary` | `#64748B` | Captions, metadata, helper text |
| Electric Purple | `--accent-purple` / `electric-purple` | `#7138F5` | Primary brand accent, active gradients |
| Royal Blue | `--accent-blue` / `electric-blue` | `#2878FF` | Gradient secondary stop, focus highlights |
| Cyan Glow | `--accent-cyan` / `electric-cyan` | `#20C8E8` | Data highlights, futuristic accents |
| Soft Purple Tint | `--bg-soft-purple` / `electric-soft` | `#F1EBFF` | Subtle icon tiles, pills, hover states |
| Border Hairline | `--border-color` / `surface-border` | `#E7EAF2` | Card frames, inputs, dividers |

### Cosmic Dark Theme (Optional User Preference)
Activated by adding `.dark` to `<html>` (managed by `ThemeProvider` and persisted via `localStorage` + `PATCH /api/v1/users/me/preferences`).

| Token | Value | Usage |
| :--- | :--- | :--- |
| Cosmic Canvas | `#070A18` | Midnight radial ambient backdrop |
| Glass Card Surface | `#0F142B` | Elevated translucent dark cards |
| Deep Input Surface | `#0B1024` | Inputs, nested pills, tab wells |
| Primary Text | `#F8FAFC` | Crisp high-contrast text |
| Secondary Text | `#94A3B8` | Muted labels and descriptions |
| Glowing Border | `rgba(113, 56, 245, 0.24)` / `#1E2749` | Subtle futuristic card edges |

---

## 2. Typography & Visual Hierarchy

- **Typeface:** `Plus Jakarta Sans` (weights `400`, `500`, `600`, `700`, `800`) loaded via `next/font/google` (`--font-sans`).
- **Gradients:** Used selectively for primary CTAs (`.btn-gradient`), active sidebar items, brand logo, and key display headlines (`.text-gradient`) — never overused on every surface.
- **Reduced Motion:** All animations and transitions automatically respect `@media (prefers-reduced-motion: reduce)`.

---

## 3. Reusable Component Library (`apps/web/src/components/ui/`)

All 18 primitives are exported from `apps/web/src/components/ui/index.ts`:

| Component | Purpose |
| :--- | :--- |
| `Button` | Variants: `primary` (purple-blue gradient), `glow`, `secondary`, `outline`, `ghost`, `danger`; loading spinner + icon slots |
| `Card` (+ `Header`, `Title`, `Description`, `Content`, `Footer`) | Variants: `default`, `glass`, `glow`, `subtle` |
| `Badge` | Variants: `default`, `success`, `warning`, `danger`, `purple`, `info`, `outline` |
| `Input` | Built-in label, helper text, error state, left/right icons, and automatic password visibility toggle |
| `Alert` | `error`/`danger`, `success`, `warning`, `info` banners with optional dismiss action |
| `Modal` | Accessible dialog with Escape-key & backdrop dismiss, `sm`/`md`/`lg`/`xl` sizing, sticky header/footer |
| `Dropdown` | Click-outside & Escape-dismissed menu with icons, dividers, and destructive actions |
| `Tabs` | `pill` (gradient active) and `underline` (gradient bar) variants with optional counts |
| `DataTable` | Typed responsive table with shimmer loading skeleton, empty state, and row click handler |
| `StatCard` | KPI card with bold metric, trend arrow badge, helper text, and colored icon tile |
| `ChartCard` | Standardized chart wrapper with title, subtitle, header controls, skeleton, and empty state |
| `PlatformBadge` / `PlatformGlyph` | Unified SVG icons, gradients, and metadata for all 8 platforms (`INSTAGRAM`, `FACEBOOK`, `TWITTER_X`, `LINKEDIN`, `PINTEREST`, `YOUTUBE`, `TIKTOK`, `THREADS`) |
| `AccountCard` | Social network connection tile (`compact` list mode & full grid mode) |
| `EmptyState` | Centered dashed glass container with icon, message, and CTA slot |
| `LoadingSkeleton` | `Skeleton`, `StatCardSkeleton`, `CardGridSkeleton`, `TableSkeleton` shimmer loaders |
| `ToastProvider` / `useToast` | Global ARIA live toast notification queue (`success`, `error`, `warning`, `info`) |
| `ConfirmationDialog` | Standardized confirmation modal built on `Modal` + `Button` |
| `ThemeToggle` & `BrandLogo` | Light/Dark theme switch and unified OmniSocial AI mark |

---

## 4. Dual Theme Persistence Architecture

1. **Pre-hydration script** in `apps/web/src/app/layout.tsx` reads `localStorage.getItem('omnisocial_theme')` before paint to avoid theme flash (defaults to `'light'`).
2. **`ThemeProvider`** (`apps/web/src/lib/theme-context.tsx`) exposes `{ theme, isDark, setTheme, toggleTheme }`.
3. **Database persistence:** Additive column `User.themePreference` (`DEFAULT 'light'`) synced via `GET /api/v1/users/me/preferences` and `PATCH /api/v1/users/me/preferences` (`@apps/api`).

---

## 5. Application Shell (`apps/web/src/components/layout/`)

- **`Sidebar.tsx`:** Desktop collapsible rail (`260px` ↔ `78px`, persisted in `localStorage`), mobile slide-over drawer, role-aware Workspace section visibility, glowing gradient active state.
- **`Header.tsx`:** Sticky glass topbar with `WorkspaceSelector`, global quick-search navigator, live inbox notifications popover (`/workspaces/:ws/inbox/notifications`), Help Center link, `ThemeToggle`, `+ New AI Post` CTA, and `UserMenu`.
