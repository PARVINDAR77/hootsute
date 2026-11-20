const fs = require('fs');
const path = require('path');

const diagramsDir = path.resolve(__dirname, 'diagrams');
if (!fs.existsSync(diagramsDir)) {
  fs.mkdirSync(diagramsDir, { recursive: true });
}

// Helper: Common SVG definitions (gradients, drop shadows, arrow markers)
function getSvgDefs() {
  return `
    <defs>
      <!-- Instagram Gradient -->
      <linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#833AB4"/>
        <stop offset="35%" stop-color="#C13584"/>
        <stop offset="70%" stop-color="#E1306C"/>
        <stop offset="90%" stop-color="#FD1D1D"/>
        <stop offset="100%" stop-color="#FCAF45"/>
      </linearGradient>

      <!-- Primary Brand Gradient -->
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>

      <!-- Tech Cyan Gradient -->
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0284C7"/>
        <stop offset="100%" stop-color="#0EA5E9"/>
      </linearGradient>

      <!-- Success Emerald Gradient -->
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669"/>
        <stop offset="100%" stop-color="#10B981"/>
      </linearGradient>

      <!-- Warning Amber Gradient -->
      <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D97706"/>
        <stop offset="100%" stop-color="#F59E0B"/>
      </linearGradient>

      <!-- Purple Accent Gradient -->
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6D28D9"/>
        <stop offset="100%" stop-color="#8B5CF6"/>
      </linearGradient>

      <!-- Card Subtle Drop Shadow -->
      <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.06"/>
      </filter>

      <!-- Elevated Drop Shadow -->
      <filter id="elevatedShadow" x="-8%" y="-8%" width="116%" height="120%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
      </filter>

      <!-- Arrow Markers -->
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B"/>
      </marker>
      <marker id="arrowPrimary" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7"/>
      </marker>
      <marker id="arrowEmerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669"/>
      </marker>
      <marker id="arrowIg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#E1306C"/>
      </marker>
    </defs>
  `;
}

// --------------------------------------------------------------------------
// DIAGRAM 1: Full Integration Roadmap Infographic
// --------------------------------------------------------------------------
const d1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Header Banner -->
  <rect x="20" y="15" width="840" height="45" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="15" width="6" height="45" rx="3" fill="url(#igGrad)"/>
  <text x="40" y="38" font-size="15" font-weight="700" fill="#0F172A">OMNISOCIAL AI &bull; MASTER INTEGRATION ROADMAP (PHASES 0 TO 11)</text>
  <text x="40" y="52" font-size="11" fill="#64748B">Comprehensive end-to-end milestone timeline from codebase audit to live production launch</text>

  <!-- Connecting Path Line -->
  <path d="M 70 125 L 810 125 M 810 240 L 70 240 M 70 355 L 810 355" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="6,4" fill="none"/>

  <!-- Row 1: Phases 0 - 3 -->
  <!-- Phase 0 -->
  <g transform="translate(40, 95)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#64748B"/>
    <circle cx="24" cy="24" r="12" fill="#F1F5F9"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#0F172A" text-anchor="middle">P0</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Codebase Audit</text>
    <text x="44" y="34" font-size="9" fill="#059669" font-weight="600">&bull; Schema &amp; TokenVault</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Audit existing models &amp; providers</text>
  </g>

  <!-- Phase 1 -->
  <g transform="translate(240, 95)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#0284C7"/>
    <circle cx="24" cy="24" r="12" fill="#E0F2FE"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#0284C7" text-anchor="middle">P1</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Meta App Setup</text>
    <text x="44" y="34" font-size="9" fill="#0284C7" font-weight="600">&bull; Dev App &amp; Secrets</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Create app, domains &amp; redirect URIs</text>
  </g>

  <!-- Phase 2 -->
  <g transform="translate(440, 95)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#8B5CF6"/>
    <circle cx="24" cy="24" r="12" fill="#EDE9FE"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#8B5CF6" text-anchor="middle">P2</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">API &amp; Scopes</text>
    <text x="44" y="34" font-size="9" fill="#8B5CF6" font-weight="600">&bull; Graph API Config</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Configure publish &amp; basic scopes</text>
  </g>

  <!-- Phase 3 -->
  <g transform="translate(640, 95)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#E1306C"/>
    <circle cx="24" cy="24" r="12" fill="#FCE7F3"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#E1306C" text-anchor="middle">P3</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Secure OAuth</text>
    <text x="44" y="34" font-size="9" fill="#E1306C" font-weight="600">&bull; AES-256 Vault</text>
    <text x="14" y="54" font-size="9" fill="#64748B">PKCE, State check, 60d exchange</text>
  </g>

  <!-- Row 2: Phases 7 <- 6 <- 5 <- 4 -->
  <!-- Phase 4 -->
  <g transform="translate(640, 210)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#059669"/>
    <circle cx="24" cy="24" r="12" fill="#D1FAE5"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">P4</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Account UI</text>
    <text x="44" y="34" font-size="9" fill="#059669" font-weight="600">&bull; Dashboard &amp; Cards</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Connect, reconnect, disconnect UI</text>
  </g>

  <!-- Phase 5 -->
  <g transform="translate(440, 210)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#D97706"/>
    <circle cx="24" cy="24" r="12" fill="#FEF3C7"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#D97706" text-anchor="middle">P5</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Single Image Pub</text>
    <text x="44" y="34" font-size="9" fill="#D97706" font-weight="600">&bull; 2-Step Container</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Container creation &amp; publish flow</text>
  </g>

  <!-- Phase 6 -->
  <g transform="translate(240, 210)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#0284C7"/>
    <circle cx="24" cy="24" r="12" fill="#E0F2FE"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#0284C7" text-anchor="middle">P6</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Redis Scheduler</text>
    <text x="44" y="34" font-size="9" fill="#0284C7" font-weight="600">&bull; Sweeper &amp; Workers</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Timezones, idempotency &amp; retry</text>
  </g>

  <!-- Phase 7 -->
  <g transform="translate(40, 210)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#8B5CF6"/>
    <circle cx="24" cy="24" r="12" fill="#EDE9FE"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#8B5CF6" text-anchor="middle">P7</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Multi-Account</text>
    <text x="44" y="34" font-size="9" fill="#8B5CF6" font-weight="600">&bull; Staggered Dispatch</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Partial success &amp; target isolation</text>
  </g>

  <!-- Row 3: Phases 8 -> 11 -->
  <!-- Phase 8 -->
  <g transform="translate(40, 325)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#EC4899"/>
    <circle cx="24" cy="24" r="12" fill="#FCE7F3"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#EC4899" text-anchor="middle">P8</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Carousel &amp; Reels</text>
    <text x="44" y="34" font-size="9" fill="#EC4899" font-weight="600">&bull; Video Encoding</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Child containers &amp; status polling</text>
  </g>

  <!-- Phase 9 -->
  <g transform="translate(240, 325)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#06B6D4"/>
    <circle cx="24" cy="24" r="12" fill="#CFFAFE"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#06B6D4" text-anchor="middle">P9</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Analytics &amp; Data</text>
    <text x="44" y="34" font-size="9" fill="#06B6D4" font-weight="600">&bull; Insights API</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Reach, impressions, engagement</text>
  </g>

  <!-- Phase 10 -->
  <g transform="translate(440, 325)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="170" height="4" rx="2" fill="#F97316"/>
    <circle cx="24" cy="24" r="12" fill="#FFEDD5"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#F97316" text-anchor="middle">P10</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#0F172A">Inbox &amp; Webhooks</text>
    <text x="44" y="34" font-size="9" fill="#F97316" font-weight="600">&bull; HMAC Verification</text>
    <text x="14" y="54" font-size="9" fill="#64748B">2-way comments &amp; mentions</text>
  </g>

  <!-- Phase 11 -->
  <g transform="translate(640, 325)" filter="url(#cardShadow)">
    <rect width="170" height="70" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
    <rect width="170" height="4" rx="2" fill="url(#igGrad)"/>
    <circle cx="24" cy="24" r="12" fill="#D1FAE5"/>
    <text x="24" y="28" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">P11</text>
    <text x="44" y="22" font-size="12" font-weight="700" fill="#059669">Production Launch</text>
    <text x="44" y="34" font-size="9" fill="#059669" font-weight="600">&bull; App Review &amp; Live</text>
    <text x="14" y="54" font-size="9" fill="#64748B">Advanced Access &amp; live switch</text>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 2: Meta App Creation Flowchart
// --------------------------------------------------------------------------
const d2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Header -->
  <rect x="20" y="12" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="12" width="6" height="42" rx="3" fill="#0284C7"/>
  <text x="38" y="34" font-size="14" font-weight="700" fill="#0F172A">META DEVELOPER APP CREATION &amp; CONFIGURATION PIPELINE</text>
  <text x="38" y="47" font-size="10.5" fill="#64748B">Strict sequential walkthrough on developers.facebook.com for OmniSocial AI</text>

  <!-- Step 1 -->
  <g transform="translate(30, 75)" filter="url(#cardShadow)">
    <rect width="150" height="150" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="150" height="5" rx="2" fill="#0284C7"/>
    <circle cx="26" cy="28" r="12" fill="#E0F2FE"/>
    <text x="26" y="32" font-size="10.5" font-weight="bold" fill="#0284C7" text-anchor="middle">01</text>
    <text x="48" y="32" font-size="12" font-weight="bold" fill="#0F172A">Sign In</text>
    <text x="14" y="58" font-size="10" font-weight="600" fill="#475569">developers.facebook.com</text>
    <text x="14" y="74" font-size="9" fill="#64748B">&bull; Register Meta Developer</text>
    <text x="14" y="88" font-size="9" fill="#64748B">&bull; Verify Business Identity</text>
    <text x="14" y="102" font-size="9" fill="#64748B">&bull; Enable 2-Factor Auth</text>
    <rect x="14" y="118" width="122" height="20" rx="4" fill="#F1F5F9"/>
    <text x="75" y="132" font-size="9" font-weight="bold" fill="#0284C7" text-anchor="middle">Developer Account</text>
  </g>

  <!-- Arrow 1 -> 2 -->
  <path d="M 185 150 L 205 150" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>

  <!-- Step 2 -->
  <g transform="translate(210, 75)" filter="url(#cardShadow)">
    <rect width="150" height="150" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="150" height="5" rx="2" fill="#8B5CF6"/>
    <circle cx="26" cy="28" r="12" fill="#EDE9FE"/>
    <text x="26" y="32" font-size="10.5" font-weight="bold" fill="#8B5CF6" text-anchor="middle">02</text>
    <text x="48" y="32" font-size="12" font-weight="bold" fill="#0F172A">Create App</text>
    <text x="14" y="58" font-size="10" font-weight="600" fill="#475569">Use Case Selection</text>
    <text x="14" y="74" font-size="9" fill="#64748B">&bull; App Name: OmniSocial AI</text>
    <text x="14" y="88" font-size="9" fill="#64748B">&bull; Type: Business / Other</text>
    <text x="14" y="102" font-size="9" fill="#64748B">&bull; Bind Business Portfolio</text>
    <rect x="14" y="118" width="122" height="20" rx="4" fill="#F1F5F9"/>
    <text x="75" y="132" font-size="9" font-weight="bold" fill="#8B5CF6" text-anchor="middle">App ID Generated</text>
  </g>

  <!-- Arrow 2 -> 3 -->
  <path d="M 365 150 L 385 150" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>

  <!-- Step 3 -->
  <g transform="translate(390, 75)" filter="url(#cardShadow)">
    <rect width="150" height="150" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="150" height="5" rx="2" fill="#E1306C"/>
    <circle cx="26" cy="28" r="12" fill="#FCE7F3"/>
    <text x="26" y="32" font-size="10.5" font-weight="bold" fill="#E1306C" text-anchor="middle">03</text>
    <text x="48" y="32" font-size="12" font-weight="bold" fill="#0F172A">Add Products</text>
    <text x="14" y="58" font-size="10" font-weight="600" fill="#475569">Instagram Graph API</text>
    <text x="14" y="74" font-size="9" fill="#64748B">&bull; Add Instagram Product</text>
    <text x="14" y="88" font-size="9" fill="#64748B">&bull; Configure Instagram Login</text>
    <text x="14" y="102" font-size="9" fill="#64748B">&bull; Add Webhooks Product</text>
    <rect x="14" y="118" width="122" height="20" rx="4" fill="#F1F5F9"/>
    <text x="75" y="132" font-size="9" font-weight="bold" fill="#E1306C" text-anchor="middle">APIs Active</text>
  </g>

  <!-- Arrow 3 -> 4 -->
  <path d="M 545 150 L 565 150" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>

  <!-- Step 4 -->
  <g transform="translate(570, 75)" filter="url(#cardShadow)">
    <rect width="140" height="150" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect width="140" height="5" rx="2" fill="#059669"/>
    <circle cx="26" cy="28" r="12" fill="#D1FAE5"/>
    <text x="26" y="32" font-size="10.5" font-weight="bold" fill="#059669" text-anchor="middle">04</text>
    <text x="48" y="32" font-size="12" font-weight="bold" fill="#0F172A">Domains &amp; URIs</text>
    <text x="14" y="58" font-size="10" font-weight="600" fill="#475569">App Settings &gt; Basic</text>
    <text x="14" y="74" font-size="9" fill="#64748B">&bull; App Domain: omnisocial.ai</text>
    <text x="14" y="88" font-size="9" fill="#64748B">&bull; Privacy Policy URL</text>
    <text x="14" y="102" font-size="9" fill="#64748B">&bull; Valid OAuth Redirect URI</text>
    <rect x="14" y="118" width="112" height="20" rx="4" fill="#F1F5F9"/>
    <text x="70" y="132" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">URLs Verified</text>
  </g>

  <!-- Arrow 4 -> 5 -->
  <path d="M 715 150 L 735 150" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>

  <!-- Step 5 -->
  <g transform="translate(735, 75)" filter="url(#cardShadow)">
    <rect width="120" height="150" rx="10" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>
    <rect width="120" height="5" rx="2" fill="url(#igGrad)"/>
    <circle cx="24" cy="28" r="12" fill="#D1FAE5"/>
    <text x="24" y="32" font-size="10.5" font-weight="bold" fill="#059669" text-anchor="middle">05</text>
    <text x="44" y="32" font-size="11.5" font-weight="bold" fill="#0F172A">Roles &amp; Keys</text>
    <text x="12" y="58" font-size="9.5" font-weight="600" fill="#475569">App Roles &amp; Vault</text>
    <text x="12" y="74" font-size="9" fill="#64748B">&bull; Add Testers</text>
    <text x="12" y="88" font-size="9" fill="#64748B">&bull; Copy App ID</text>
    <text x="12" y="102" font-size="9" fill="#64748B">&bull; Vault App Secret</text>
    <rect x="12" y="118" width="96" height="20" rx="4" fill="#F1F5F9"/>
    <text x="60" y="132" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">Ready for OAuth</text>
  </g>

  <!-- Bottom Visual Callout: Critical Security Rules -->
  <g transform="translate(30, 245)" filter="url(#cardShadow)">
    <rect width="825" height="175" rx="10" fill="#F8FAFC" stroke="#CBD5E1"/>
    <rect width="825" height="4" rx="2" fill="url(#igGrad)"/>
    <text x="25" y="28" font-size="12" font-weight="700" fill="#0F172A">CRITICAL CONFIGURATION ATTRIBUTES IN META DASHBOARD</text>
    
    <!-- Box A: OAuth Redirect URI -->
    <g transform="translate(25, 42)">
      <rect width="250" height="115" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="22" font-size="11" font-weight="bold" fill="#0284C7">Valid OAuth Redirect URIs</text>
      <text x="15" y="40" font-size="9" fill="#334155">Must match exactly byte-for-byte:</text>
      <rect x="12" y="48" width="226" height="26" rx="4" fill="#F1F5F9"/>
      <text x="18" y="65" font-size="8.5" font-family="monospace" fill="#0F172A">https://api.omnisocial.ai/v1/oauth/callback</text>
      <text x="15" y="90" font-size="8.5" fill="#64748B">&bull; Local: http://localhost:4000/api/v1/oauth/meta/callback</text>
      <text x="15" y="103" font-size="8.5" fill="#EF4444" font-weight="600">&bull; No wildcard * or HTTP in production</text>
    </g>

    <!-- Box B: App Secret Vaulting -->
    <g transform="translate(290, 42)">
      <rect width="250" height="115" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="22" font-size="11" font-weight="bold" fill="#E1306C">App Secret Security</text>
      <text x="15" y="40" font-size="9" fill="#334155">Stored strictly in NestJS ConfigService:</text>
      <rect x="12" y="48" width="226" height="26" rx="4" fill="#F1F5F9"/>
      <text x="18" y="65" font-size="8.5" font-family="monospace" fill="#0F172A">META_APP_SECRET=a8b3f... (64 hex)</text>
      <text x="15" y="90" font-size="8.5" fill="#64748B">&bull; NEVER expose in Next.js bundle</text>
      <text x="15" y="103" font-size="8.5" fill="#EF4444" font-weight="600">&bull; Exclude from Git (.env.production)</text>
    </g>

    <!-- Box C: App Modes -->
    <g transform="translate(555, 42)">
      <rect width="245" height="115" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="22" font-size="11" font-weight="bold" fill="#059669">App Mode: Development vs Live</text>
      <text x="15" y="40" font-size="9" fill="#334155">Sandbox vs Public access rules:</text>
      <rect x="12" y="48" width="221" height="26" rx="4" fill="#ECFDF5"/>
      <text x="18" y="65" font-size="8.5" font-weight="bold" fill="#059669">Dev Mode: Only App Roles can connect</text>
      <text x="15" y="90" font-size="8.5" fill="#64748B">&bull; Add IG accounts as App Testers</text>
      <text x="15" y="103" font-size="8.5" fill="#334155">&bull; Live Mode requires App Review approval</text>
    </g>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 3: Instagram OAuth Sequence Diagram
// --------------------------------------------------------------------------
const d3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 460" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="40" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="40" rx="3" fill="#E1306C"/>
  <text x="38" y="32" font-size="14" font-weight="700" fill="#0F172A">INSTAGRAM OAUTH 2.0 PKCE &amp; ENCRYPTED TOKEN VAULT SEQUENCE</text>
  <text x="38" y="44" font-size="10" fill="#64748B">Secure CSRF state validation, long-lived token exchange, and AES-256-GCM vaulting</text>

  <!-- Swimlane Headers -->
  <g transform="translate(30, 60)">
    <rect x="0" y="0" width="130" height="32" rx="6" fill="#0F172A"/>
    <text x="65" y="20" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Customer Browser</text>
    <line x1="65" y1="32" x2="65" y2="385" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,4"/>

    <rect x="170" y="0" width="130" height="32" rx="6" fill="#0284C7"/>
    <text x="235" y="20" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Next.js 14 Frontend</text>
    <line x1="235" y1="32" x2="235" y2="385" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,4"/>

    <rect x="340" y="0" width="140" height="32" rx="6" fill="#6D28D9"/>
    <text x="410" y="20" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">NestJS API &amp; Vault</text>
    <line x1="410" y1="32" x2="410" y2="385" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,4"/>

    <rect x="520" y="0" width="140" height="32" rx="6" fill="#E1306C"/>
    <text x="590" y="20" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Meta OAuth Dialog</text>
    <line x1="590" y1="32" x2="590" y2="385" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,4"/>

    <rect x="690" y="0" width="140" height="32" rx="6" fill="#059669"/>
    <text x="760" y="20" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PostgreSQL + Prisma</text>
    <line x1="760" y1="32" x2="760" y2="385" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,4"/>
  </g>

  <!-- Step 1: User clicks connect -->
  <g transform="translate(0, 110)">
    <path d="M 95 0 L 265 0" stroke="#0F172A" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="180" y="-6" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">1. Click "Connect Instagram"</text>
  </g>

  <!-- Step 2: Next.js requests auth URL from NestJS -->
  <g transform="translate(0, 140)">
    <path d="M 265 0 L 440 0" stroke="#0284C7" stroke-width="1.5" marker-end="url(#arrowPrimary)"/>
    <text x="350" y="-6" font-size="9" font-weight="bold" fill="#0284C7" text-anchor="middle">2. POST /oauth/initiate { provider: META_INSTAGRAM }</text>
  </g>

  <!-- Step 3: NestJS generates state & saves in DB -->
  <g transform="translate(0, 170)">
    <path d="M 440 0 L 790 0" stroke="#6D28D9" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="615" y="-6" font-size="9" font-weight="bold" fill="#6D28D9" text-anchor="middle">3. Save OAuthState (UUID, workspaceId, expires in 10m)</text>
  </g>

  <!-- Step 4: NestJS returns Auth URL to Browser -->
  <g transform="translate(0, 200)">
    <path d="M 440 0 L 95 0" stroke="#6D28D9" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)"/>
    <text x="270" y="-6" font-size="9" font-weight="bold" fill="#6D28D9" text-anchor="middle">4. Return Meta Dialog URL with state &amp; required scopes</text>
  </g>

  <!-- Step 5: User redirects to Meta and approves -->
  <g transform="translate(0, 235)">
    <path d="M 95 0 L 620 0" stroke="#E1306C" stroke-width="1.5" marker-end="url(#arrowIg)"/>
    <text x="355" y="-6" font-size="9" font-weight="bold" fill="#E1306C" text-anchor="middle">5. Redirect to Meta &bull; User selects Instagram Accounts &amp; Approves</text>
  </g>

  <!-- Step 6: Meta redirects to Callback with code & state -->
  <g transform="translate(0, 270)">
    <path d="M 620 0 L 440 0" stroke="#E1306C" stroke-width="1.5" marker-end="url(#arrowIg)"/>
    <text x="530" y="-6" font-size="9" font-weight="bold" fill="#E1306C" text-anchor="middle">6. Callback GET /oauth/callback?code=AQD...&amp;state=xyz</text>
  </g>

  <!-- Step 7: NestJS validates state, exchanges short-lived & long-lived token -->
  <g transform="translate(0, 305)">
    <rect x="420" y="-12" width="220" height="24" rx="4" fill="#FDF2F8" stroke="#F472B6"/>
    <text x="530" y="4" font-size="8.5" font-weight="bold" fill="#BE185D" text-anchor="middle">7. Exchange Code &gt; Short-Lived &gt; 60-Day Long-Lived Token</text>
  </g>

  <!-- Step 8: TokenVault encrypts token with AES-256-GCM -->
  <g transform="translate(0, 340)">
    <rect x="360" y="-12" width="220" height="24" rx="4" fill="#EDE9FE" stroke="#A78BFA"/>
    <text x="470" y="4" font-size="8.5" font-weight="bold" fill="#5B21B6" text-anchor="middle">8. TokenVault.encrypt(token) -&gt; v1:iv:tag:cipher</text>
  </g>

  <!-- Step 9: Store in PostgreSQL & redirect to frontend -->
  <g transform="translate(0, 380)">
    <path d="M 440 0 L 790 0" stroke="#059669" stroke-width="1.5" marker-end="url(#arrowEmerald)"/>
    <text x="615" y="-6" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">9. Upsert SocialAccount (workspaceId, encryptedAccessToken)</text>
    <path d="M 440 20 L 95 20" stroke="#059669" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrowEmerald)"/>
    <text x="260" y="14" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">10. 302 Redirect to /settings/social-accounts?connected=true</text>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 4: Complete System Architecture
// --------------------------------------------------------------------------
const d4 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 460" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="#0F172A"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">OMNISOCIAL AI &bull; MULTI-TIER INSTAGRAM INTEGRATION ARCHITECTURE</text>
  <text x="40" y="45" font-size="10.5" fill="#64748B">Strict unidirectional data flow: Browser &gt; Next.js &gt; NestJS Gateway &gt; PostgreSQL / Redis &gt; Meta API</text>

  <!-- Tier 1: Next.js Frontend -->
  <g transform="translate(30, 65)" filter="url(#cardShadow)">
    <rect width="820" height="70" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
    <rect width="820" height="4" rx="2" fill="#0284C7"/>
    <text x="20" y="24" font-size="11" font-weight="bold" fill="#0284C7">TIER 1: NEXT.JS 14 APP ROUTER FRONTEND (CLIENT &amp; SERVER COMPONENTS)</text>
    
    <!-- Pills -->
    <g transform="translate(20, 34)">
      <rect x="0" y="0" width="150" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="75" y="17" font-size="9.5" font-weight="600" fill="#0F172A" text-anchor="middle">Social Accounts View</text>

      <rect x="160" y="0" width="150" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="235" y="17" font-size="9.5" font-weight="600" fill="#0F172A" text-anchor="middle">Instagram Connect Modal</text>

      <rect x="320" y="0" width="150" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="395" y="17" font-size="9.5" font-weight="600" fill="#0F172A" text-anchor="middle">Post Composer &amp; Media</text>

      <rect x="480" y="0" width="140" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="550" y="17" font-size="9.5" font-weight="600" fill="#0F172A" text-anchor="middle">Content Calendar</text>

      <rect x="630" y="0" width="150" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="705" y="17" font-size="9.5" font-weight="600" fill="#0F172A" text-anchor="middle">Analytics Dashboard</text>
    </g>
  </g>

  <!-- Downward Flow Arrow 1 -> 2 -->
  <path d="M 440 140 L 440 160" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>
  <text x="450" y="152" font-size="8.5" font-weight="bold" fill="#0284C7">REST API (JWT Bearer + Workspace-Id)</text>

  <!-- Tier 2: NestJS Backend API -->
  <g transform="translate(30, 165)" filter="url(#cardShadow)">
    <rect width="820" height="95" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
    <rect width="820" height="4" rx="2" fill="#6D28D9"/>
    <text x="20" y="22" font-size="11" font-weight="bold" fill="#6D28D9">TIER 2: NESTJS BACKEND API &amp; MODULAR PROVIDER ADAPTERS</text>
    
    <!-- Sub-modules -->
    <g transform="translate(20, 32)">
      <rect x="0" y="0" width="145" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="72" y="18" font-size="9.5" font-weight="bold" fill="#0F172A" text-anchor="middle">Auth &amp; RBAC Guard</text>
      <text x="72" y="34" font-size="8.5" fill="#64748B" text-anchor="middle">JWT, Workspace, IDOR check</text>

      <rect x="155" y="0" width="155" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="232" y="18" font-size="9.5" font-weight="bold" fill="#0F172A" text-anchor="middle">MetaOAuthService</text>
      <text x="232" y="34" font-size="8.5" fill="#64748B" text-anchor="middle">State, PKCE, 60d exchange</text>

      <rect x="320" y="0" width="165" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="402" y="18" font-size="9.5" font-weight="bold" fill="#0F172A" text-anchor="middle">TokenVaultService</text>
      <text x="402" y="34" font-size="8.5" fill="#64748B" text-anchor="middle">AES-256-GCM Dual-Key Vault</text>

      <rect x="495" y="0" width="155" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="572" y="18" font-size="9.5" font-weight="bold" fill="#0F172A" text-anchor="middle">Instagram Publisher</text>
      <text x="572" y="34" font-size="8.5" fill="#64748B" text-anchor="middle">2-Step Media Containers</text>

      <rect x="660" y="0" width="140" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="730" y="18" font-size="9.5" font-weight="bold" fill="#0F172A" text-anchor="middle">Scheduling Service</text>
      <text x="730" y="34" font-size="8.5" fill="#64748B" text-anchor="middle">Timezones &amp; Snapshots</text>
    </g>
  </g>

  <!-- Split Downward Arrows 2 -> 3A & 3B -->
  <path d="M 240 265 L 240 285" stroke="#6D28D9" stroke-width="2" marker-end="url(#arrow)"/>
  <path d="M 640 265 L 640 285" stroke="#6D28D9" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Tier 3: Data Layer (PostgreSQL on Left, Redis on Right) -->
  <g transform="translate(30, 290)">
    <!-- PostgreSQL Box -->
    <g transform="translate(0, 0)" filter="url(#cardShadow)">
      <rect width="395" height="85" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
      <rect width="395" height="4" rx="2" fill="#059669"/>
      <text x="20" y="22" font-size="11" font-weight="bold" fill="#059669">TIER 3A: POSTGRESQL 18 + PRISMA ORM</text>
      <g transform="translate(15, 32)">
        <rect x="0" y="0" width="115" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="57" y="16" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">SocialAccount</text>
        <text x="57" y="30" font-size="7.5" fill="#64748B" text-anchor="middle">Encrypted Token, ID</text>

        <rect x="125" y="0" width="115" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="182" y="16" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">ScheduledPost</text>
        <text x="182" y="30" font-size="7.5" fill="#64748B" text-anchor="middle">Targets, Timezone</text>

        <rect x="250" y="0" width="115" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="307" y="16" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">PublishingLog</text>
        <text x="307" y="30" font-size="7.5" fill="#64748B" text-anchor="middle">Audit trail &amp; errors</text>
      </g>
    </g>

    <!-- Redis Workers Box -->
    <g transform="translate(425, 0)" filter="url(#cardShadow)">
      <rect width="395" height="85" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
      <rect width="395" height="4" rx="2" fill="#DC2626"/>
      <text x="20" y="22" font-size="11" font-weight="bold" fill="#DC2626">TIER 3B: REDIS &amp; BULLMQ PUBLISHING WORKERS</text>
      <g transform="translate(15, 32)">
        <rect x="0" y="0" width="115" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="57" y="16" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">Sweeper Engine</text>
        <text x="57" y="30" font-size="7.5" fill="#64748B" text-anchor="middle">Dispatches due posts</text>

        <rect x="125" y="0" width="115" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="182" y="16" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">Publish Worker</text>
        <text x="182" y="30" font-size="7.5" fill="#64748B" text-anchor="middle">Rate limit throttle</text>

        <rect x="250" y="0" width="115" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="307" y="16" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle">Reconciler</text>
        <text x="307" y="30" font-size="7.5" fill="#64748B" text-anchor="middle">Ambiguous timeout check</text>
      </g>
    </g>
  </g>

  <!-- Downward Flow Arrow 3 -> 4 -->
  <path d="M 440 380 L 440 400" stroke="#E1306C" stroke-width="2" marker-end="url(#arrowIg)"/>

  <!-- Tier 4: External Meta Instagram Graph API -->
  <g transform="translate(30, 405)" filter="url(#cardShadow)">
    <rect width="820" height="45" rx="8" fill="#FFF1F2" stroke="#FDA4AF"/>
    <rect width="820" height="3" rx="1.5" fill="url(#igGrad)"/>
    <text x="20" y="27" font-size="11.5" font-weight="bold" fill="#9F1239">EXTERNAL TIER: OFFICIAL META INSTAGRAM GRAPH API v21.0</text>
    <text x="470" y="27" font-size="9.5" fill="#BE123C">POST /{ig-user-id}/media &bull; POST /{ig-user-id}/media_publish &bull; GET /{ig-user-id}/insights</text>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 5: Instagram Account Connection Decision Tree
// --------------------------------------------------------------------------
const d5 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="url(#igGrad)"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">INSTAGRAM ACCOUNT ELIGIBILITY &amp; LOGIN PATH DECISION TREE</text>
  <text x="40" y="46" font-size="10.5" fill="#64748B">Determine user account type, prerequisites, and route between Instagram Login vs Page-Linked Login</text>

  <!-- Start Node -->
  <g transform="translate(40, 75)" filter="url(#cardShadow)">
    <rect width="180" height="70" rx="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
    <rect width="180" height="4" rx="2" fill="#0F172A"/>
    <text x="90" y="25" font-size="11" font-weight="bold" fill="#0F172A" text-anchor="middle">Customer Initiates</text>
    <text x="90" y="40" font-size="9" fill="#475569" text-anchor="middle">Clicks "Connect Instagram"</text>
    <rect x="25" y="46" width="130" height="18" rx="4" fill="#F1F5F9"/>
    <text x="90" y="58" font-size="8.5" font-weight="bold" fill="#0F172A" text-anchor="middle">Account Type Check</text>
  </g>

  <!-- Arrow to Diamond 1 -->
  <path d="M 225 110 L 265 110" stroke="#0F172A" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Diamond 1: Personal Account? -->
  <g transform="translate(270, 70)">
    <polygon points="80,0 160,40 80,80 0,40" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.5"/>
    <text x="80" y="36" font-size="10" font-weight="bold" fill="#991B1B" text-anchor="middle">Is it Personal</text>
    <text x="80" y="50" font-size="9" fill="#991B1B" text-anchor="middle">Instagram?</text>
  </g>

  <!-- Branch YES: Error Box (Personal Account Unsupported) -->
  <path d="M 350 70 L 350 45 L 470 45" stroke="#EF4444" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="365" y="40" font-size="9" font-weight="bold" fill="#EF4444">YES (Blocked)</text>

  <g transform="translate(475, 20)" filter="url(#cardShadow)">
    <rect width="365" height="52" rx="6" fill="#FEF2F2" stroke="#F87171"/>
    <text x="15" y="20" font-size="10" font-weight="bold" fill="#B91C1C">UNSUPPORTED ACCOUNT TYPE</text>
    <text x="15" y="34" font-size="8.5" fill="#7F1D1D">Meta Graph API strictly prohibits publishing to personal accounts.</text>
    <text x="15" y="45" font-size="8.5" font-weight="bold" fill="#991B1B">Action: In Instagram app &gt; Settings &gt; Switch to Professional Account (Free)</text>
  </g>

  <!-- Branch NO: Professional Account (Proceeds to Diamond 2) -->
  <path d="M 350 150 L 350 200 L 270 200" stroke="#059669" stroke-width="2" marker-end="url(#arrowEmerald)"/>
  <text x="360" y="180" font-size="9" font-weight="bold" fill="#059669">NO (Professional)</text>

  <!-- Diamond 2: Login Route Preference -->
  <g transform="translate(110, 160)">
    <polygon points="80,0 160,40 80,80 0,40" fill="#F0FDF4" stroke="#059669" stroke-width="1.5"/>
    <text x="80" y="36" font-size="10" font-weight="bold" fill="#166534" text-anchor="middle">Select Login Path</text>
    <text x="80" y="50" font-size="8.5" fill="#166534" text-anchor="middle">Route A or B?</text>
  </g>

  <!-- Route A: Instagram Login (Recommended) -->
  <path d="M 190 240 L 190 280 L 110 280 L 110 300" stroke="#E1306C" stroke-width="2" marker-end="url(#arrowIg)"/>
  <text x="120" y="270" font-size="9" font-weight="bold" fill="#E1306C">Route A (Instagram-First)</text>

  <g transform="translate(30, 305)" filter="url(#cardShadow)">
    <rect width="380" height="120" rx="8" fill="#FFFFFF" stroke="#E1306C" stroke-width="1.5"/>
    <rect width="380" height="4" rx="2" fill="url(#igGrad)"/>
    <text x="15" y="22" font-size="11" font-weight="bold" fill="#E1306C">ROUTE A: INSTAGRAM LOGIN (RECOMMENDED)</text>
    <text x="15" y="38" font-size="9" font-weight="600" fill="#0F172A">Direct Instagram User Authentication</text>
    <text x="15" y="52" font-size="8.5" fill="#475569">&bull; Facebook Page Connection: <tspan font-weight="bold" fill="#059669">NOT required</tspan></text>
    <text x="15" y="66" font-size="8.5" fill="#475569">&bull; Host: api.instagram.com / graph.instagram.com</text>
    <text x="15" y="80" font-size="8.5" fill="#475569">&bull; Scopes: instagram_business_basic, instagram_business_content_publish</text>
    <text x="15" y="94" font-size="8.5" fill="#475569">&bull; Account Types: Professional (Creator or Business)</text>
    <rect x="15" y="100" width="350" height="14" rx="3" fill="#FDF2F8"/>
    <text x="190" y="110" font-size="8" font-weight="bold" fill="#BE185D" text-anchor="middle">Fastest frictionless setup for Instagram-only customers</text>
  </g>

  <!-- Route B: Facebook Login (Page-Linked) -->
  <path d="M 270 200 L 460 200 L 460 300" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>
  <text x="330" y="192" font-size="9" font-weight="bold" fill="#0284C7">Route B (Facebook Page-Linked)</text>

  <g transform="translate(450, 305)" filter="url(#cardShadow)">
    <rect width="400" height="120" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
    <rect width="400" height="4" rx="2" fill="#0284C7"/>
    <text x="15" y="22" font-size="11" font-weight="bold" fill="#0284C7">ROUTE B: FACEBOOK LOGIN (PAGE-LINKED)</text>
    <text x="15" y="38" font-size="9" font-weight="600" fill="#0F172A">Enterprise Meta Graph API Path</text>
    <text x="15" y="52" font-size="8.5" fill="#475569">&bull; Facebook Page Connection: <tspan font-weight="bold" fill="#DC2626">MANDATORY</tspan> (IG linked to Page)</text>
    <text x="15" y="66" font-size="8.5" fill="#475569">&bull; Host: graph.facebook.com/v21.0</text>
    <text x="15" y="80" font-size="8.5" fill="#475569">&bull; Scopes: instagram_basic, instagram_content_publish, pages_show_list</text>
    <text x="15" y="94" font-size="8.5" fill="#475569">&bull; Token: Long-lived Page Access Token inherits Instagram permissions</text>
    <rect x="15" y="100" width="370" height="14" rx="3" fill="#F0F9FF"/>
    <text x="200" y="110" font-size="8" font-weight="bold" fill="#0369A1" text-anchor="middle">Ideal when user also manages Facebook Page within same workspace</text>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 6: Instagram Media Publishing Workflow
// --------------------------------------------------------------------------
const d6 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="#E1306C"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">INSTAGRAM 2-STAGE MEDIA CONTAINER PUBLISHING ENGINE</text>
  <text x="40" y="46" font-size="10.5" fill="#64748B">Step-by-step lifecycle: Validation &gt; S3 Public Storage &gt; Container Creation &gt; Container Publish &gt; Verification</text>

  <!-- Step 1: Media Preparation -->
  <g transform="translate(30, 75)" filter="url(#cardShadow)">
    <rect width="185" height="160" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <rect width="185" height="4" rx="2" fill="#0284C7"/>
    <circle cx="26" cy="26" r="11" fill="#E0F2FE"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#0284C7" text-anchor="middle">1</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Media Validation</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">Storage &amp; Formatting</text>
    <text x="15" y="68" font-size="8.5" fill="#64748B">&bull; Stored on public HTTPS (S3)</text>
    <text x="15" y="82" font-size="8.5" fill="#64748B">&bull; Format: JPEG / PNG</text>
    <text x="15" y="96" font-size="8.5" fill="#64748B">&bull; Max size: 8 MB</text>
    <text x="15" y="110" font-size="8.5" fill="#64748B">&bull; Aspect: 4:5 to 1.91:1</text>
    <rect x="15" y="125" width="155" height="22" rx="4" fill="#F1F5F9"/>
    <text x="92" y="139" font-size="8" font-family="monospace" fill="#0284C7" text-anchor="middle">https://s3.../photo.jpg</text>
  </g>

  <!-- Arrow 1 -> 2 -->
  <path d="M 220 155 L 245 155" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>

  <!-- Step 2: Create Media Container -->
  <g transform="translate(250, 75)" filter="url(#cardShadow)">
    <rect width="190" height="160" rx="8" fill="#FFFFFF" stroke="#E1306C" stroke-width="1.5"/>
    <rect width="190" height="4" rx="2" fill="#E1306C"/>
    <circle cx="26" cy="26" r="11" fill="#FCE7F3"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#E1306C" text-anchor="middle">2</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Create Container</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">POST /{ig-user-id}/media</text>
    <rect x="12" y="60" width="166" height="58" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="18" y="74" font-size="7.5" font-family="monospace" fill="#0F172A">{</text>
    <text x="24" y="86" font-size="7.5" font-family="monospace" fill="#0F172A">  image_url: "https://...",</text>
    <text x="24" y="98" font-size="7.5" font-family="monospace" fill="#0F172A">  caption: "New post #ai",</text>
    <text x="24" y="110" font-size="7.5" font-family="monospace" fill="#0F172A">  access_token: "..."</text>
    <text x="18" y="122" font-size="7.5" font-family="monospace" fill="#0F172A">}</text>
    <rect x="15" y="125" width="160" height="22" rx="4" fill="#FDF2F8"/>
    <text x="95" y="139" font-size="8.5" font-weight="bold" fill="#BE185D" text-anchor="middle">Returns: { id: "creation_id" }</text>
  </g>

  <!-- Arrow 2 -> 3 -->
  <path d="M 445 155 L 470 155" stroke="#E1306C" stroke-width="2" marker-end="url(#arrowIg)"/>

  <!-- Step 3: Check Processing (Optional for photos, mandatory for video/carousel) -->
  <g transform="translate(475, 75)" filter="url(#cardShadow)">
    <rect width="180" height="160" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <rect width="180" height="4" rx="2" fill="#8B5CF6"/>
    <circle cx="26" cy="26" r="11" fill="#EDE9FE"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#8B5CF6" text-anchor="middle">3</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Status Check</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">GET /{creation_id}</text>
    <text x="15" y="68" font-size="8.5" fill="#64748B">&bull; Immediate for single images</text>
    <text x="15" y="82" font-size="8.5" fill="#64748B">&bull; Poll loop for video/reels</text>
    <text x="15" y="96" font-size="8.5" fill="#64748B">&bull; status_code == FINISHED</text>
    <text x="15" y="110" font-size="8.5" fill="#EF4444">&bull; Error if EXPIRED or ERROR</text>
    <rect x="15" y="125" width="150" height="22" rx="4" fill="#F3E8FF"/>
    <text x="90" y="139" font-size="8.5" font-weight="bold" fill="#6D28D9" text-anchor="middle">Container Ready</text>
  </g>

  <!-- Arrow 3 -> 4 -->
  <path d="M 660 155 L 685 155" stroke="#059669" stroke-width="2" marker-end="url(#arrowEmerald)"/>

  <!-- Step 4: Media Publish -->
  <g transform="translate(690, 75)" filter="url(#cardShadow)">
    <rect width="160" height="160" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>
    <rect width="160" height="4" rx="2" fill="#059669"/>
    <circle cx="26" cy="26" r="11" fill="#D1FAE5"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">4</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Publish Container</text>
    <text x="15" y="52" font-size="8.5" font-weight="600" fill="#334155">POST /{id}/media_publish</text>
    <rect x="12" y="60" width="136" height="58" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="18" y="74" font-size="7.5" font-family="monospace" fill="#0F172A">{</text>
    <text x="24" y="86" font-size="7.5" font-family="monospace" fill="#0F172A">  creation_id: "...",</text>
    <text x="24" y="98" font-size="7.5" font-family="monospace" fill="#0F172A">  access_token: "..."</text>
    <text x="18" y="110" font-size="7.5" font-family="monospace" fill="#0F172A">}</text>
    <rect x="15" y="125" width="130" height="22" rx="4" fill="#ECFDF5"/>
    <text x="80" y="139" font-size="8.5" font-weight="bold" fill="#059669" text-anchor="middle">Live on Instagram</text>
  </g>

  <!-- Step 5: Bottom Persistence & Audit Loop -->
  <g transform="translate(30, 260)" filter="url(#cardShadow)">
    <rect width="820" height="160" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
    <rect width="820" height="4" rx="2" fill="url(#igGrad)"/>
    <text x="25" y="26" font-size="12" font-weight="700" fill="#0F172A">STEP 5: RESULT RECONCILIATION &amp; AUDIT TRAIL LOGGING</text>

    <!-- Sub-Box A: Prisma Update -->
    <g transform="translate(25, 42)">
      <rect width="250" height="100" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="20" font-size="10.5" font-weight="bold" fill="#059669">1. Update ScheduledPostTarget</text>
      <text x="15" y="38" font-size="8.5" fill="#334155">&bull; status: PUBLISHED</text>
      <text x="15" y="52" font-size="8.5" fill="#334155">&bull; externalPostId: "18029384756..."</text>
      <text x="15" y="66" font-size="8.5" fill="#334155">&bull; externalPostUrl: https://instagram.com/p/...</text>
      <text x="15" y="80" font-size="8.5" fill="#059669" font-weight="600">&bull; executedAt: NOW()</text>
    </g>

    <!-- Sub-Box B: Audit Logging -->
    <g transform="translate(295, 42)">
      <rect width="250" height="100" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="20" font-size="10.5" font-weight="bold" fill="#0284C7">2. Create PublishingLog</text>
      <text x="15" y="38" font-size="8.5" fill="#334155">&bull; outcome: SUCCESS</text>
      <text x="15" y="52" font-size="8.5" fill="#334155">&bull; rawResponse: { id, creation_id }</text>
      <text x="15" y="66" font-size="8.5" fill="#334155">&bull; latencyMs: 840ms</text>
      <text x="15" y="80" font-size="8.5" fill="#0284C7" font-weight="600">&bull; Immutable security audit record</text>
    </g>

    <!-- Sub-Box C: UI Notification -->
    <g transform="translate(565, 42)">
      <rect width="230" height="100" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="20" font-size="10.5" font-weight="bold" fill="#E1306C">3. Broadcast to Next.js UI</text>
      <text x="15" y="38" font-size="8.5" fill="#334155">&bull; SSE / Polling updates Calendar badge</text>
      <text x="15" y="52" font-size="8.5" fill="#334155">&bull; "Published" green badge rendered</text>
      <text x="15" y="66" font-size="8.5" fill="#334155">&bull; Direct link to view live on IG</text>
      <text x="15" y="80" font-size="8.5" fill="#E1306C" font-weight="600">&bull; Immediate user feedback</text>
    </g>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 7: Scheduling & Redis Worker Workflow
// --------------------------------------------------------------------------
const d7 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="#DC2626"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">REDIS BULLMQ PUBLISHING WORKER &amp; RECONCILIATION PIPELINE</text>
  <text x="40" y="46" font-size="10.5" fill="#64748B">Timezone resolution, idempotency locks, exponential backoff retries, and failure recovery</text>

  <!-- Left: Scheduled Post Created -->
  <g transform="translate(30, 75)" filter="url(#cardShadow)">
    <rect width="170" height="180" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <rect width="170" height="4" rx="2" fill="#0284C7"/>
    <circle cx="26" cy="26" r="11" fill="#E0F2FE"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#0284C7" text-anchor="middle">1</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Scheduled Post</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">Draft Approved</text>
    <text x="15" y="68" font-size="8.5" fill="#64748B">&bull; scheduledAt: 2026-11-20</text>
    <text x="15" y="82" font-size="8.5" fill="#64748B">&bull; timezone: America/New_York</text>
    <text x="15" y="96" font-size="8.5" fill="#64748B">&bull; status: SCHEDULED</text>
    <text x="15" y="110" font-size="8.5" fill="#64748B">&bull; contentSnapshot + hash</text>
    <rect x="15" y="130" width="140" height="35" rx="4" fill="#F1F5F9"/>
    <text x="85" y="145" font-size="8" font-weight="bold" fill="#0284C7" text-anchor="middle">UTC Normalized: 15:00Z</text>
    <text x="85" y="157" font-size="7.5" fill="#64748B" text-anchor="middle">Saved in PostgreSQL</text>
  </g>

  <!-- Arrow 1 -> 2 -->
  <path d="M 205 165 L 230 165" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowPrimary)"/>

  <!-- Center: Redis BullMQ Queue -->
  <g transform="translate(235, 75)" filter="url(#cardShadow)">
    <rect width="190" height="180" rx="8" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>
    <rect width="190" height="4" rx="2" fill="#DC2626"/>
    <circle cx="26" cy="26" r="11" fill="#FEE2E2"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#DC2626" text-anchor="middle">2</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">BullMQ Redis Queue</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">Queue: "social-publishing"</text>
    <text x="15" y="68" font-size="8.5" fill="#64748B">&bull; Sweeper enqueues due jobs</text>
    <text x="15" y="82" font-size="8.5" fill="#64748B">&bull; Job ID: post_{id}_{target_id}</text>
    <text x="15" y="96" font-size="8.5" fill="#64748B">&bull; Deduplication key enforced</text>
    <text x="15" y="110" font-size="8.5" fill="#64748B">&bull; Backoff: exponential 30s-15m</text>
    <rect x="15" y="130" width="160" height="35" rx="4" fill="#FEF2F2"/>
    <text x="95" y="145" font-size="8" font-weight="bold" fill="#DC2626" text-anchor="middle">Atomic Distributed Lock</text>
    <text x="95" y="157" font-size="7.5" fill="#991B1B" text-anchor="middle">Prevents Double Posting</text>
  </g>

  <!-- Arrow 2 -> 3 -->
  <path d="M 430 165 L 455 165" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Right: Worker Dispatcher -->
  <g transform="translate(460, 75)" filter="url(#cardShadow)">
    <rect width="190" height="180" rx="8" fill="#FFFFFF" stroke="#059669"/>
    <rect width="190" height="4" rx="2" fill="#059669"/>
    <circle cx="26" cy="26" r="11" fill="#D1FAE5"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">3</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Publish Worker</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">Worker Execution Loop</text>
    <text x="15" y="68" font-size="8.5" fill="#64748B">1. Decrypt token via TokenVault</text>
    <text x="15" y="82" font-size="8.5" fill="#64748B">2. Check Instagram rate limits</text>
    <text x="15" y="96" font-size="8.5" fill="#64748B">3. Create media container</text>
    <text x="15" y="110" font-size="8.5" fill="#64748B">4. Publish container to IG</text>
    <rect x="15" y="130" width="160" height="35" rx="4" fill="#ECFDF5"/>
    <text x="95" y="145" font-size="8" font-weight="bold" fill="#059669" text-anchor="middle">Meta API: HTTP 200 OK</text>
    <text x="95" y="157" font-size="7.5" fill="#065F46" text-anchor="middle">Live Post ID Generated</text>
  </g>

  <!-- Arrow 3 -> 4 (Reconciliation) -->
  <path d="M 655 165 L 680 165" stroke="#059669" stroke-width="2" marker-end="url(#arrowEmerald)"/>

  <!-- Far Right: Reconciler / Error Handler -->
  <g transform="translate(685, 75)" filter="url(#cardShadow)">
    <rect width="165" height="180" rx="8" fill="#FFFFFF" stroke="#F59E0B"/>
    <rect width="165" height="4" rx="2" fill="#F59E0B"/>
    <circle cx="26" cy="26" r="11" fill="#FEF3C7"/>
    <text x="26" y="30" font-size="10" font-weight="bold" fill="#D97706" text-anchor="middle">4</text>
    <text x="45" y="29" font-size="11" font-weight="bold" fill="#0F172A">Reconciler</text>
    <text x="15" y="52" font-size="9" font-weight="600" fill="#334155">Fault Recovery</text>
    <text x="15" y="68" font-size="8.5" fill="#64748B">&bull; Catches network drops</text>
    <text x="15" y="82" font-size="8.5" fill="#64748B">&bull; Checks if post exists on IG</text>
    <text x="15" y="96" font-size="8.5" fill="#64748B">&bull; Prevents duplicate retries</text>
    <text x="15" y="110" font-size="8.5" fill="#64748B">&bull; Marks definitive fail on 400</text>
    <rect x="15" y="130" width="135" height="35" rx="4" fill="#FFFBEB"/>
    <text x="82" y="145" font-size="8" font-weight="bold" fill="#B45309" text-anchor="middle">Zero Lost Posts</text>
    <text x="82" y="157" font-size="7.5" fill="#78350F" text-anchor="middle">Strict Consistency</text>
  </g>

  <!-- Bottom: Error Handling Matrix -->
  <g transform="translate(30, 275)" filter="url(#cardShadow)">
    <rect width="820" height="145" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="20" y="24" font-size="11" font-weight="bold" fill="#0F172A">AUTOMATIC WORKER ERROR HANDLING &amp; RETRY SPECIFICATION</text>
    
    <g transform="translate(20, 36)">
      <!-- Box A -->
      <rect x="0" y="0" width="250" height="90" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="18" font-size="10" font-weight="bold" fill="#059669">TRANSIENT NETWORK FAULT (5xx / TIMEOUT)</text>
      <text x="15" y="34" font-size="8.5" fill="#475569">&bull; Action: Exponential backoff retry (3 attempts)</text>
      <text x="15" y="48" font-size="8.5" fill="#475569">&bull; Delays: +60s, +300s, +900s</text>
      <text x="15" y="62" font-size="8.5" fill="#475569">&bull; Target status remains IN_PROGRESS</text>
      <text x="15" y="76" font-size="8.5" fill="#059669" font-weight="600">&bull; Reconciler verifies external status first</text>

      <!-- Box B -->
      <rect x="265" y="0" width="250" height="90" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="18" font-size="10" font-weight="bold" fill="#DC2626">DEFINITIVE CLIENT ERROR (4xx / BAD MEDIA)</text>
      <text x="15" y="34" font-size="8.5" fill="#475569">&bull; Action: Immediate abort &bull; NO RETRIES</text>
      <text x="15" y="48" font-size="8.5" fill="#475569">&bull; Target status updated to FAILED</text>
      <text x="15" y="62" font-size="8.5" fill="#475569">&bull; Sanitized error message saved in DB</text>
      <text x="15" y="76" font-size="8.5" fill="#DC2626" font-weight="600">&bull; User notified in App with fix instructions</text>

      <!-- Box C -->
      <rect x="530" y="0" width="250" height="90" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="15" y="18" font-size="10" font-weight="bold" fill="#D97706">RATE LIMIT (25 POSTS/24H OR BUC LIMIT)</text>
      <text x="15" y="34" font-size="8.5" fill="#475569">&bull; Action: Delay job until rate limit window resets</text>
      <text x="15" y="48" font-size="8.5" fill="#475569">&bull; Read X-Business-Use-Case-Usage header</text>
      <text x="15" y="62" font-size="8.5" fill="#475569">&bull; Target status remains SCHEDULED_DELAYED</text>
      <text x="15" y="76" font-size="8.5" fill="#D97706" font-weight="600">&bull; Workspace alert fired for admin</text>
    </g>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 8: Multi-Account Publishing Diagram
// --------------------------------------------------------------------------
const d8 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="#8B5CF6"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">MULTI-ACCOUNT INDEPENDENT TARGET STATE MACHINE ARCHITECTURE</text>
  <text x="40" y="46" font-size="10.5" fill="#64748B">Single post broadcasted to 3 Instagram accounts with isolated tokens, staggered dispatch, and partial success</text>

  <!-- Left: Content Draft -->
  <g transform="translate(30, 80)" filter="url(#cardShadow)">
    <rect width="210" height="240" rx="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
    <rect width="210" height="4" rx="2" fill="url(#igGrad)"/>
    <text x="20" y="28" font-size="12" font-weight="bold" fill="#0F172A">ScheduledPost</text>
    <text x="20" y="44" font-size="9" fill="#64748B">ID: sp_9831f42 (Workspace Alpha)</text>
    
    <rect x="15" y="55" width="180" height="70" rx="6" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="75" font-size="9.5" font-weight="bold" fill="#0F172A">Post Content Snapshot</text>
    <text x="25" y="90" font-size="8.5" fill="#475569">&bull; Caption: "Exciting launch #ai"</text>
    <text x="25" y="104" font-size="8.5" fill="#475569">&bull; Media: https://s3.../hero.jpg</text>
    <text x="25" y="118" font-size="8.5" fill="#059669">&bull; SHA-256 Hash Verified</text>

    <text x="20" y="145" font-size="10" font-weight="bold" fill="#8B5CF6">Selected Publishing Targets (3):</text>
    <text x="20" y="162" font-size="9" fill="#334155">&bull; Target 1: @omnisocial_global</text>
    <text x="20" y="176" font-size="9" fill="#334155">&bull; Target 2: @omnisocial_uk</text>
    <text x="20" y="190" font-size="9" fill="#334155">&bull; Target 3: @omnisocial_apac</text>

    <rect x="15" y="205" width="180" height="22" rx="4" fill="#F1F5F9"/>
    <text x="105" y="219" font-size="8" font-weight="bold" fill="#0F172A" text-anchor="middle">Staggered Dispatch Interval: 1.5s</text>
  </g>

  <!-- Split Connectors -->
  <path d="M 245 140 L 310 120" stroke="#059669" stroke-width="2" marker-end="url(#arrowEmerald)"/>
  <path d="M 245 190 L 310 200" stroke="#EF4444" stroke-width="2" marker-end="url(#arrow)"/>
  <path d="M 245 240 L 310 280" stroke="#059669" stroke-width="2" marker-end="url(#arrowEmerald)"/>

  <!-- Right: 3 Independent Target Cards -->
  <!-- Target 1: Success -->
  <g transform="translate(320, 75)" filter="url(#cardShadow)">
    <rect width="520" height="75" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>
    <rect width="6" height="75" rx="3" fill="#059669"/>
    <text x="20" y="22" font-size="11" font-weight="bold" fill="#059669">TARGET 1: @omnisocial_global (US Main Account)</text>
    <rect x="420" y="10" width="85" height="18" rx="4" fill="#D1FAE5"/>
    <text x="462" y="22" font-size="8.5" font-weight="bold" fill="#059669" text-anchor="middle">PUBLISHED</text>
    
    <text x="20" y="42" font-size="9" fill="#475569">&bull; Account ID: 1784140029381 &bull; Token Decrypted: AES-256-GCM (Key v1)</text>
    <text x="20" y="56" font-size="9" fill="#475569">&bull; Live IG Post ID: 18029384918239 &bull; Latency: 920ms &bull; Attempts: 1/3</text>
    <text x="20" y="68" font-size="8" font-family="monospace" fill="#059669">https://www.instagram.com/p/DB7xKq19/</text>
  </g>

  <!-- Target 2: Partial Failure / Transient Retry -->
  <g transform="translate(320, 160)" filter="url(#cardShadow)">
    <rect width="520" height="85" rx="8" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.5"/>
    <rect width="6" height="85" rx="3" fill="#F59E0B"/>
    <text x="20" y="22" font-size="11" font-weight="bold" fill="#D97706">TARGET 2: @omnisocial_uk (UK Regional Account)</text>
    <rect x="390" y="10" width="115" height="18" rx="4" fill="#FEF3C7"/>
    <text x="447" y="22" font-size="8.5" font-weight="bold" fill="#B45309" text-anchor="middle">RETRY_QUEUED</text>
    
    <text x="20" y="42" font-size="9" fill="#475569">&bull; Account ID: 1784140084729 &bull; Token Decrypted: AES-256-GCM (Key v1)</text>
    <text x="20" y="56" font-size="9" fill="#DC2626">&bull; Meta Error: (#1) An unknown error occurred (503 Service Unavailable)</text>
    <text x="20" y="70" font-size="8.5" fill="#64748B">&bull; Attempt 1/3 failed &bull; Next retry scheduled in +60 seconds &bull; Does NOT block other accounts</text>
  </g>

  <!-- Target 3: Success -->
  <g transform="translate(320, 255)" filter="url(#cardShadow)">
    <rect width="520" height="75" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>
    <rect width="6" height="75" rx="3" fill="#059669"/>
    <text x="20" y="22" font-size="11" font-weight="bold" fill="#059669">TARGET 3: @omnisocial_apac (Singapore APAC Account)</text>
    <rect x="420" y="10" width="85" height="18" rx="4" fill="#D1FAE5"/>
    <text x="462" y="22" font-size="8.5" font-weight="bold" fill="#059669" text-anchor="middle">PUBLISHED</text>
    
    <text x="20" y="42" font-size="9" fill="#475569">&bull; Account ID: 1784140092841 &bull; Token Decrypted: AES-256-GCM (Key v1)</text>
    <text x="20" y="56" font-size="9" fill="#475569">&bull; Live IG Post ID: 18029384918455 &bull; Latency: 1,140ms &bull; Attempts: 1/3</text>
    <text x="20" y="68" font-size="8" font-family="monospace" fill="#059669">https://www.instagram.com/p/DB7xKq42/</text>
  </g>

  <!-- Bottom Summary Callout -->
  <g transform="translate(30, 345)" filter="url(#cardShadow)">
    <rect width="810" height="75" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
    <text x="20" y="22" font-size="10.5" font-weight="bold" fill="#0F172A">KEY MULTI-ACCOUNT PUBLISHING ADVANTAGES IN OMNISOCIAL AI</text>
    <text x="20" y="40" font-size="8.5" fill="#334155">&bull; <tspan font-weight="bold">No Cascade Failure:</tspan> Failure on one regional account never interrupts or cancels publishing to remaining accounts.</text>
    <text x="20" y="54" font-size="8.5" fill="#334155">&bull; <tspan font-weight="bold">Anti-Burst Delay:</tspan> Staggered 1.5s delay between account dispatches prevents Meta anti-bot rate-limit triggers.</text>
    <text x="20" y="68" font-size="8.5" fill="#334155">&bull; <tspan font-weight="bold">Granular Audit Records:</tspan> Each target has its own attempt count, error message, latency metric, and external URL.</text>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 9: Comprehensive Security Architecture
// --------------------------------------------------------------------------
const d9 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="#059669"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">OMNISOCIAL AI &bull; END-TO-END SECURITY &amp; ENCRYPTION ARCHITECTURE</text>
  <text x="40" y="46" font-size="10.5" fill="#64748B">Defense-in-depth: TLS 1.3, RBAC, Workspace isolation, TokenVault AES-256-GCM, and Webhook HMAC verification</text>

  <!-- 4 Columns of Security Layers -->
  <!-- Layer 1: Boundary & Auth -->
  <g transform="translate(30, 75)" filter="url(#cardShadow)">
    <rect width="190" height="340" rx="8" fill="#FFFFFF" stroke="#0284C7"/>
    <rect width="190" height="4" rx="2" fill="#0284C7"/>
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0284C7">1. BOUNDARY &amp; RBAC</text>
    
    <g transform="translate(15, 40)">
      <rect width="160" height="60" rx="4" fill="#F0F9FF" stroke="#BAE6FD"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0369A1">TLS 1.3 Strict</text>
      <text x="12" y="32" font-size="8" fill="#0284C7">HTTPS only everywhere</text>
      <text x="12" y="45" font-size="8" fill="#0284C7">HSTS preload enforced</text>
    </g>

    <g transform="translate(15, 110)">
      <rect width="160" height="65" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0F172A">JWT Authentication</text>
      <text x="12" y="32" font-size="8" fill="#64748B">HttpOnly Secure Cookies</text>
      <text x="12" y="45" font-size="8" fill="#64748B">Rotating Refresh Tokens</text>
      <text x="12" y="58" font-size="8" fill="#64748B">Reuse detection logic</text>
    </g>

    <g transform="translate(15, 185)">
      <rect width="160" height="70" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0F172A">Workspace RBAC</text>
      <text x="12" y="32" font-size="8" fill="#64748B">&bull; OWNER: Full access</text>
      <text x="12" y="45" font-size="8" fill="#64748B">&bull; ADMIN: Connect/Disconnect</text>
      <text x="12" y="58" font-size="8" fill="#64748B">&bull; EDITOR: Draft &amp; Publish</text>
      <text x="12" y="71" font-size="8" fill="#64748B">&bull; VIEWER: Read-only stats</text>
    </g>

    <g transform="translate(15, 265)">
      <rect width="160" height="55" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="12" y="18" font-size="9" font-weight="bold" fill="#991B1B">CSRF State Guard</text>
      <text x="12" y="32" font-size="8" fill="#B91C1C">Cryptographic state</text>
      <text x="12" y="45" font-size="8" fill="#B91C1C">Single-use &bull; 10m TTL</text>
    </g>
  </g>

  <!-- Layer 2: Workspace Isolation (Anti-IDOR) -->
  <g transform="translate(240, 75)" filter="url(#cardShadow)">
    <rect width="190" height="340" rx="8" fill="#FFFFFF" stroke="#6D28D9"/>
    <rect width="190" height="4" rx="2" fill="#6D28D9"/>
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#6D28D9">2. TENANT ISOLATION</text>

    <g transform="translate(15, 40)">
      <rect width="160" height="75" rx="4" fill="#FAF5FF" stroke="#E9D5FF"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#6D28D9">IDOR Prevention</text>
      <text x="12" y="32" font-size="8" fill="#5B21B6">Every database query</text>
      <text x="12" y="45" font-size="8" fill="#5B21B6">strictly filters on</text>
      <text x="12" y="58" font-size="8" font-family="monospace" fill="#0F172A">where: { workspaceId }</text>
      <text x="12" y="70" font-size="8" fill="#5B21B6">Cross-tenant leak = 0%</text>
    </g>

    <g transform="translate(15, 125)">
      <rect width="160" height="85" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0F172A">Prisma Middleware</text>
      <text x="12" y="32" font-size="8" fill="#64748B">Automatic validation</text>
      <text x="12" y="45" font-size="8" fill="#64748B">of active workspace</text>
      <text x="12" y="58" font-size="8" fill="#64748B">context before find,</text>
      <text x="12" y="71" font-size="8" fill="#64748B">update or delete</text>
    </g>

    <g transform="translate(15, 220)">
      <rect width="160" height="100" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0F172A">No Client-Side Secrets</text>
      <text x="12" y="32" font-size="8" fill="#64748B">Browser NEVER sees:</text>
      <text x="12" y="46" font-size="8" fill="#EF4444">&bull; META_APP_SECRET</text>
      <text x="12" y="60" font-size="8" fill="#EF4444">&bull; Plaintext Access Token</text>
      <text x="12" y="74" font-size="8" fill="#EF4444">&bull; Encryption Keys</text>
      <text x="12" y="88" font-size="8" fill="#059669">&bull; Backend-only API proxy</text>
    </g>
  </g>

  <!-- Layer 3: TokenVault AES-256-GCM -->
  <g transform="translate(450, 75)" filter="url(#cardShadow)">
    <rect width="200" height="340" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>
    <rect width="200" height="4" rx="2" fill="#059669"/>
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#059669">3. TOKEN VAULT (GCM)</text>

    <g transform="translate(15, 40)">
      <rect width="170" height="110" rx="4" fill="#ECFDF5" stroke="#A7F3D0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#065F46">AES-256-GCM Vault</text>
      <text x="12" y="32" font-size="8" fill="#047857">&bull; 256-bit Key Derivation</text>
      <text x="12" y="46" font-size="8" fill="#047857">&bull; 96-bit Unique Random IV</text>
      <text x="12" y="60" font-size="8" fill="#047857">&bull; 128-bit Auth Tag (Tamper-proof)</text>
      <text x="12" y="74" font-size="8" fill="#047857">&bull; Storage Payload Format:</text>
      <rect x="8" y="80" width="154" height="22" rx="3" fill="#FFFFFF"/>
      <text x="85" y="94" font-size="7" font-family="monospace" fill="#065F46" text-anchor="middle">v1:iv:tag:ciphertext</text>
    </g>

    <g transform="translate(15, 160)">
      <rect width="170" height="90" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0F172A">Dual-Key Rotation</text>
      <text x="12" y="32" font-size="8" fill="#64748B">&bull; PRIMARY_KEY encrypts all</text>
      <text x="12" y="46" font-size="8" fill="#64748B">&bull; FALLBACK_KEY decrypts legacy</text>
      <text x="12" y="60" font-size="8" fill="#64748B">&bull; Auto-re-encrypts on read</text>
      <text x="12" y="74" font-size="8" fill="#059669" font-weight="600">&bull; Zero-downtime key rotation</text>
    </g>

    <g transform="translate(15, 260)">
      <rect width="170" height="60" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9" font-weight="bold" fill="#0F172A">Memory Hygiene</text>
      <text x="12" y="32" font-size="8" fill="#64748B">Decrypted tokens only exist</text>
      <text x="12" y="45" font-size="8" fill="#64748B">ephemerally during HTTP call</text>
    </g>
  </g>

  <!-- Layer 4: Webhook & Audit Security -->
  <g transform="translate(670, 75)" filter="url(#cardShadow)">
    <rect width="180" height="340" rx="8" fill="#FFFFFF" stroke="#E1306C"/>
    <rect width="180" height="4" rx="2" fill="url(#igGrad)"/>
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#E1306C">4. WEBHOOKS &amp; AUDIT</text>

    <g transform="translate(15, 40)">
      <rect width="150" height="85" rx="4" fill="#FDF2F8" stroke="#FBCFE8"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#9D174D">HMAC-SHA256</text>
      <text x="12" y="32" font-size="8" fill="#BE185D">X-Hub-Signature-256</text>
      <text x="12" y="46" font-size="8" fill="#BE185D">verified with constant-time</text>
      <text x="12" y="60" font-size="8" font-family="monospace" fill="#0F172A">timingSafeEqual()</text>
      <text x="12" y="74" font-size="8" fill="#BE185D">Prevents timing attacks</text>
    </g>

    <g transform="translate(15, 135)">
      <rect width="150" height="85" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9.5" font-weight="bold" fill="#0F172A">Audit Trail</text>
      <text x="12" y="32" font-size="8" fill="#64748B">Immutable PublishingLog</text>
      <text x="12" y="46" font-size="8" fill="#64748B">&bull; User ID &amp; IP address</text>
      <text x="12" y="60" font-size="8" fill="#64748B">&bull; Target account &amp; time</text>
      <text x="12" y="74" font-size="8" fill="#64748B">&bull; Sanitized API response</text>
    </g>

    <g transform="translate(15, 230)">
      <rect width="150" height="90" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="12" y="18" font-size="9" font-weight="bold" fill="#0F172A">Safe Logging</text>
      <text x="12" y="32" font-size="8" fill="#64748B">Regex scrubbers strip:</text>
      <text x="12" y="46" font-size="8" fill="#EF4444">&bull; access_token</text>
      <text x="12" y="60" font-size="8" fill="#EF4444">&bull; client_secret</text>
      <text x="12" y="74" font-size="8" fill="#EF4444">&bull; session hashes</text>
      <text x="12" y="88" font-size="8" fill="#059669">from all server logs</text>
    </g>
  </g>
</svg>
`;

// --------------------------------------------------------------------------
// DIAGRAM 10: Production Deployment & App Review Checklist
// --------------------------------------------------------------------------
const d10 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 440" width="100%" height="100%" style="background:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${getSvgDefs()}

  <!-- Top Title -->
  <rect x="20" y="10" width="840" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="20" y="10" width="6" height="42" rx="3" fill="#059669"/>
  <text x="40" y="32" font-size="14" font-weight="700" fill="#0F172A">PRODUCTION DEPLOYMENT &amp; META APP REVIEW READINESS INFOGRAPHIC</text>
  <text x="40" y="46" font-size="10.5" fill="#64748B">Comprehensive 5-stage gating criteria required before launching public Instagram publishing in live mode</text>

  <!-- 5 Horizontal Check Columns -->
  <!-- Col 1: Meta App Settings -->
  <g transform="translate(30, 75)" filter="url(#cardShadow)">
    <rect width="150" height="340" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <rect width="150" height="4" rx="2" fill="#0284C7"/>
    <text x="15" y="24" font-size="10.5" font-weight="bold" fill="#0284C7">1. APP SETTINGS</text>
    <text x="15" y="38" font-size="8.5" fill="#64748B">Dashboard Essentials</text>

    <g transform="translate(10, 50)">
      <rect width="130" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Privacy Policy</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Live HTTPS URL with</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">data processing rules</text>
    </g>

    <g transform="translate(10, 110)">
      <rect width="130" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Data Deletion</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">User deletion callback</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">with status tracking</text>
    </g>

    <g transform="translate(10, 170)">
      <rect width="130" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">App Icon</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">1024x1024 transparent</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">PNG SaaS logo</text>
    </g>

    <g transform="translate(10, 230)">
      <rect width="130" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">App Domains</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">omnisocial.ai</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">api.omnisocial.ai</text>
    </g>

    <g transform="translate(10, 290)">
      <rect width="130" height="38" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
      <text x="65" y="22" font-size="8.5" font-weight="bold" fill="#166534" text-anchor="middle">Pass Checklist</text>
    </g>
  </g>

  <!-- Col 2: Business Verification -->
  <g transform="translate(195, 75)" filter="url(#cardShadow)">
    <rect width="155" height="340" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <rect width="155" height="4" rx="2" fill="#8B5CF6"/>
    <text x="15" y="24" font-size="10.5" font-weight="bold" fill="#8B5CF6">2. VERIFICATION</text>
    <text x="15" y="38" font-size="8.5" fill="#64748B">Meta Business Manager</text>

    <g transform="translate(10, 50)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Legal Business</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Certificate of inc.</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">or tax registration</text>
    </g>

    <g transform="translate(10, 110)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Phone / Domain</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">DNS TXT record</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">or SMS verification</text>
    </g>

    <g transform="translate(10, 170)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Tech Provider</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Sign Tech Provider</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">Amendment in Meta</text>
    </g>

    <g transform="translate(10, 230)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">App Ownership</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">App assigned to verified</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">Business Portfolio</text>
    </g>

    <g transform="translate(10, 290)">
      <rect width="135" height="38" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
      <text x="67" y="22" font-size="8.5" font-weight="bold" fill="#166534" text-anchor="middle">Pass Verification</text>
    </g>
  </g>

  <!-- Col 3: App Review Screencast -->
  <g transform="translate(365, 75)" filter="url(#cardShadow)">
    <rect width="160" height="340" rx="8" fill="#FFFFFF" stroke="#E1306C" stroke-width="1.5"/>
    <rect width="160" height="4" rx="2" fill="#E1306C"/>
    <text x="15" y="24" font-size="10.5" font-weight="bold" fill="#E1306C">3. APP REVIEW</text>
    <text x="15" y="38" font-size="8.5" fill="#64748B">Scope Justifications</text>

    <g transform="translate(10, 50)">
      <rect width="140" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Screencast Video</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Show login &gt; approve</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">&gt; publish live post</text>
    </g>

    <g transform="translate(10, 110)">
      <rect width="140" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Demo Credentials</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Working test user credentials</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">for Meta reviewers</text>
    </g>

    <g transform="translate(10, 170)">
      <rect width="140" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Permission Justify</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Written explanation of</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">why each scope is needed</text>
    </g>

    <g transform="translate(10, 230)">
      <rect width="140" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Advanced Access</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Request Level 2 Access</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">for public users</text>
    </g>

    <g transform="translate(10, 290)">
      <rect width="140" height="38" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
      <text x="70" y="22" font-size="8.5" font-weight="bold" fill="#166534" text-anchor="middle">Pass App Review</text>
    </g>
  </g>

  <!-- Col 4: Cloud Infrastructure -->
  <g transform="translate(540, 75)" filter="url(#cardShadow)">
    <rect width="155" height="340" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <rect width="155" height="4" rx="2" fill="#D97706"/>
    <text x="15" y="24" font-size="10.5" font-weight="bold" fill="#D97706">4. INFRASTRUCTURE</text>
    <text x="15" y="38" font-size="8.5" fill="#64748B">Production Hardening</text>

    <g transform="translate(10, 50)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Postgres SSL</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">TLS encrypted DB</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">Connection pool limits</text>
    </g>

    <g transform="translate(10, 110)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Redis Cluster</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Persistent BullMQ queues</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">High availability</text>
    </g>

    <g transform="translate(10, 170)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">S3 CORS &amp; CDN</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Public HTTPS read</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">for Meta crawler</text>
    </g>

    <g transform="translate(10, 230)">
      <rect width="135" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Secrets Vault</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">AWS KMS or</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">Doppler injected env</text>
    </g>

    <g transform="translate(10, 290)">
      <rect width="135" height="38" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
      <text x="67" y="22" font-size="8.5" font-weight="bold" fill="#166534" text-anchor="middle">Pass Infra Audit</text>
    </g>
  </g>

  <!-- Col 5: Go Live Switch -->
  <g transform="translate(710, 75)" filter="url(#cardShadow)">
    <rect width="140" height="340" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>
    <rect width="140" height="4" rx="2" fill="#059669"/>
    <text x="15" y="24" font-size="10.5" font-weight="bold" fill="#059669">5. GO LIVE</text>
    <text x="15" y="38" font-size="8.5" fill="#64748B">Live Mode Activated</text>

    <g transform="translate(10, 50)">
      <rect width="120" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Toggle Live</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">App Mode switch in</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">Meta Header</text>
    </g>

    <g transform="translate(10, 110)">
      <rect width="120" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Rate Alerting</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">PagerDuty / Slack</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">alerts on 4xx/5xx</text>
    </g>

    <g transform="translate(10, 170)">
      <rect width="120" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Health Checks</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">/health endpoint</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">polling Meta Graph</text>
    </g>

    <g transform="translate(10, 230)">
      <rect width="120" height="50" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="16" cy="18" r="6" fill="#059669"/>
      <text x="28" y="21" font-size="8.5" font-weight="bold" fill="#0F172A">Public Ready</text>
      <text x="12" y="36" font-size="7.5" fill="#64748B">Any customer can</text>
      <text x="12" y="46" font-size="7.5" fill="#64748B">now connect &amp; post</text>
    </g>

    <g transform="translate(10, 290)">
      <rect width="120" height="38" rx="4" fill="#ECFDF5" stroke="#6EE7B7"/>
      <text x="60" y="22" font-size="8.5" font-weight="bold" fill="#047857" text-anchor="middle">LIVE IN PROD</text>
    </g>
  </g>
</svg>
`;

// Save all diagrams to the diagrams directory
const diagramFiles = [
  { name: 'diagram-1-integration-roadmap.svg', content: d1 },
  { name: 'diagram-2-meta-app-creation.svg', content: d2 },
  { name: 'diagram-3-oauth-authorization-flow.svg', content: d3 },
  { name: 'diagram-4-system-architecture.svg', content: d4 },
  { name: 'diagram-5-account-connection-decision.svg', content: d5 },
  { name: 'diagram-6-media-publishing-workflow.svg', content: d6 },
  { name: 'diagram-7-scheduling-redis-workers.svg', content: d7 },
  { name: 'diagram-8-multi-account-publishing.svg', content: d8 },
  { name: 'diagram-9-security-architecture.svg', content: d9 },
  { name: 'diagram-10-production-deployment-checklist.svg', content: d10 },
];

for (const d of diagramFiles) {
  const filePath = path.join(diagramsDir, d.name);
  fs.writeFileSync(filePath, d.content.trim(), 'utf8');
  console.log('Saved diagram:', d.name, fs.statSync(filePath).size, 'bytes');
}

console.log('All 10 diagrams successfully generated!');
