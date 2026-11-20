# Design & Frontend Redesign Audit — OmniSocial AI

> **Audit Date:** 2026-11-18  
> **Target:** Transform existing light-only admin UI into a futuristic, 3D-enhanced, dual-theme (Light default + Dark optional) international SaaS platform with a complete public marketing website.

> [!WARNING]
> **Visual Reference Image Needed Before Phase 1:** The Master Implementation Prompt states *"I have provided a reference image showing the desired visual direction"*, but no reference image was attached to the prompt message. Please upload/attach the target reference image when approving Phase 0 so Phase 1–9 match its exact visual composition, gradients, 3D aesthetic, and card hierarchy.

---

## 1. Current Frontend Baseline (`apps/web`)

### Installed Packages (`apps/web/package.json`)
- **Framework:** `next@14.2.3` (runtime `14.2.35`), `react@18.3.1`, `typescript@5.4.5`
- **Styling:** `tailwindcss@3.4.3`, `clsx`, `tailwind-merge`, `lucide-react@0.379.0`
- **Forms & Data:** `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-query`
- **Missing for Futuristic 3D Redesign:** `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion` (or `motion`), `gsap` (to be evaluated and lazy-loaded cleanly in Phase 1 / Phase 9).

### Current Pages Inventory (33 Pages)
- **Public / Entry (4):** `/` (redirects to `/login`), `/invitations/accept`, `/unauthorized`, `/onboarding/workspace`
- **Auth (4):** `/login`, `/register`, `/forgot-password` (placeholder), `/reset-password` (placeholder)
- **Authenticated Dashboard (25):** `/dashboard`, `/content/studio`, `/content/drafts`, `/content/drafts/[id]`, `/bulk-publish`, `/calendar`, `/media`, `/links`, `/analytics`, `/reports`, `/competitors`, `/inbox`, `/listening`, `/automations`, `/settings`, `/settings/workspace`, `/settings/members`, `/settings/invitations`, `/settings/social-accounts`, `/settings/social-accounts/connect`, `/settings/brand-kit`, `/settings/billing`, `/settings/white-label`, `/settings/inbox-moderation`, `/settings/webhooks`

### Current Reusable Components (32 Components)
- **Primitives (`components/ui/`):** `Alert`, `Badge`, `Button`, `Card`, `Input` *(only 5 primitives — missing `Modal`, `Dropdown`, `Tabs`, `DataTable`, `StatCard`, `ChartCard`, `PlatformBadge`, `AccountCard`, `EmptyState`, `LoadingSkeleton`, `Toast`, `ConfirmationDialog`)*
- **Layout (`components/layout/`):** `Sidebar`, `Header`, `UserMenu`, `WorkspaceSelector`
- **Domain Widgets:** `analytics/*` (6), `approvals/*` (2), `calendar/*` (3), `inbox/*` (6), `links/*` (2), `listening/*` (1), `media/*` (1), `notifications/*` (1), `pwa/*` (1)

---

## 2. Gap Analysis Against Target Design System

| Dimension | Current State | Target Redesign Specification | Gap / Work Required |
| :--- | :--- | :--- | :--- |
| **Color Palette** | `#F8FAFC` bg, generic Indigo `#4F46E5` primary, slate borders | Light default `#F7F8FC`, surface `#FFFFFF`, primary `#7138F5`, blue `#2878FF`, cyan `#20C8E8`, soft purple `#F1EBFF`, border `#E7EAF2`, dark mode palette | Update `tailwind.config.js` & `globals.css` design tokens (Phase 1) |
| **Themes** | Light theme only; no toggle or persistence | Light (default) + Dark (optional) persisted via user preference & `localStorage` + CSS class strategy (`darkMode: 'class'`) | Build `ThemeProvider`, toggle in navbar, dark tokens across all components (Phase 1) |
| **Public Website** | **0 marketing pages** (`/` redirects straight to `/login`) | Complete public site: `/`, `/features`, `/platforms`, `/pricing`, `/about`, `/contact`, `/blog`, `/blog/[slug]`, `/faq`, `/privacy`, `/terms`, `/security`, `/help` with shared `PublicNavbar` & `PublicFooter` | Create `(marketing)` route group & full SEO metadata/sitemap/robots (Phase 2) |
| **Auth Experience** | Centered single-column form; `/register` instead of `/signup`; `/forgot-password` & `/reset-password` are static alerts | Split-screen layout with 3D visual panel, clean form, password visibility toggle, `/signup` + `/login` + real `/forgot-password` + `/reset-password` + `/verify-email` | Upgrade `(auth)` layout + wire real backend recovery/verification APIs (Phase 3) |
| **Dashboard App Shell** | Fixed 260px sidebar (no collapse toggle), no global search bar, no notifications dropdown, no help or theme toggle in header | Collapsible sidebar (expanded/collapsed + mobile drawer), top bar with workspace selector, global search, notifications popover, help trigger, theme switch, user menu | Upgrade `Sidebar`, `Header`, and `(dashboard)/layout.tsx` (Phase 1 & Phase 4) |
| **Reusable Component Library** | 5 basic UI primitives; inconsistent ad-hoc modals/tables across pages | Unified 16-component design system (`Button`, `Card`, `Modal`, `Dropdown`, `Tabs`, `DataTable`, `StatCard`, `ChartCard`, `PlatformBadge`, `AccountCard`, `EmptyState`, `LoadingSkeleton`, `Toast`, `ConfirmationDialog`, `Sidebar`, `Navbar`) | Build shared primitives in `components/ui/` and standardize pages (Phase 1) |
| **Dedicated Routes Missing** | Insights live inside `/analytics`; approvals live inside `/content/drafts` | Add `/analytics/insights` route + ensure `/signup` route exists | Add dedicated routes reusing existing APIs (Phases 3 & 8) |
| **3D & Motion** | Basic CSS `fadeIn` only; zero 3D scenes or scroll animations | Lazy-loaded Three.js / React Three Fiber Hero 3D Command Center + Framer Motion page/card transitions + reduced-motion & mobile fallbacks | Install & implement responsibly with lazy loading & GPU budgets (Phase 9) |
| **SEO & Metadata** | Basic root title/description only; no `robots.ts` or `sitemap.ts` | Full Open Graph, canonical URLs, `sitemap.ts`, `robots.ts` (allowing public marketing routes, blocking `/dashboard`, `/settings`, `/content`, `/inbox`, etc.) | Implement in Phase 2 & verify in Phase 11 |

---

## 3. Code Quality & Hygiene Findings in Current Frontend

1. **Duplicate Platform Badge Logic:** Platform colors/icons are re-declared independently inside `dashboard/page.tsx`, `content/studio/page.tsx`, `content/drafts/page.tsx`, `bulk-publish/page.tsx`, `calendar/page.tsx`, and `settings/social-accounts/page.tsx`. Consolidating into one shared `<PlatformBadge />` component will ensure all 8 networks look identical everywhere.
2. **Ad-Hoc Modals & Alerts:** Several pages inline fixed-overlay modals without ESC-key closing, focus trapping, or consistent backdrop blur. Replacing with a shared accessible `<Modal />` and `<Toast />` system fixes UX & accessibility simultaneously.
3. **Missing Loading Skeletons:** Most pages display a plain spinner instead of structural skeletons, causing layout shifts on load.
4. **Remaining Minor WhatsApp Copy:** `apps/web/src/app/(dashboard)/automations/page.tsx` lines 55, 69, 682 still show `"whatsapp me"` in spam-keyword placeholders/defaults.
