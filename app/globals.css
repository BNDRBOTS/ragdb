@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-inter: 'Inter', sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ==================================================================
   LANDING DESIGN SYSTEM  ·  scope: app/page.tsx (.landing) only
   ------------------------------------------------------------------
   Everything below is additive and self-contained. The app shell
   (chat, documents, auth) is untouched by every rule in this block.

   Tokens are OKLCH. No color is hardcoded outside this block for
   the landing surface; app/page.tsx references these variables.
   ================================================================== */

:root {
  /* -- Surfaces ---------------------------------------------------- */
  --ld-void: oklch(13.5% 0.014 258);        /* page base — obsidian   */
  --ld-deep: oklch(17% 0.018 256);          /* raised panel base      */
  --ld-glass: oklch(96% 0.01 250 / 0.04);   /* glass fill             */
  --ld-glass-hi: oklch(96% 0.01 250 / 0.07);/* glass fill, hover      */
  --ld-line: oklch(92% 0.02 250 / 0.09);    /* hairline border        */
  --ld-line-strong: oklch(92% 0.02 250 / 0.17);

  /* -- Ink --------------------------------------------------------- */
  --ld-text: oklch(94% 0.008 250);          /* primary text           */
  --ld-muted: oklch(70% 0.014 250);         /* secondary text         */
  --ld-faint: oklch(57% 0.014 250);         /* labels / micro caps    */

  /* -- Accents ------------------------------------------------------
     Ice blue is the dominant accent — same lineage as the app's
     blue-600 CTAs, lifted for dark glass. Amber appears only inside
     the cockpit miniature, exactly where the real app uses it.      */
  --ld-ice: oklch(76% 0.115 248);           /* glow, labels, links    */
  --ld-cta: oklch(54.5% 0.2 263);           /* ≈ app blue-600         */
  --ld-cta-hover: oklch(61% 0.19 260);      /* ≈ app blue-500         */
}

/* -- Type roles ------------------------------------------------------
   Variables are injected per-page by next/font in app/page.tsx.     */
.landing {
  background-color: var(--ld-void);
  color: var(--ld-text);
  font-family: var(--ld-font-body), 'Hanken Grotesk', sans-serif;
  font-feature-settings: 'ss01' on;
}
.landing .f-display {
  font-family: var(--ld-font-display), 'Bricolage Grotesque', sans-serif;
}
.landing .f-mono {
  font-family: var(--ld-font-mono), 'JetBrains Mono', monospace;
}

/* -- Display ink: ice gradient on the second hero line -------------- */
.landing .ld-ink {
  background: linear-gradient(
    100deg,
    oklch(86% 0.07 240) 0%,
    var(--ld-ice) 45%,
    oklch(64% 0.16 256) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* -- Primary CTA surface -------------------------------------------- */
.landing .ld-cta {
  background-color: var(--ld-cta);
  box-shadow: 0 0 0 1px oklch(70% 0.15 255 / 0.25) inset,
    0 12px 32px -12px oklch(60% 0.2 260 / 0.55);
}
.landing .ld-cta:hover {
  background-color: var(--ld-cta-hover);
  box-shadow: 0 0 0 1px oklch(78% 0.13 252 / 0.35) inset,
    0 16px 40px -12px oklch(64% 0.19 258 / 0.65);
}

/* -- Focus ring: visible replacement, never removed ------------------ */
.landing .ld-focus {
  outline: none;
}
.landing .ld-focus:focus-visible {
  box-shadow: 0 0 0 2px var(--ld-void), 0 0 0 4px var(--ld-ice);
  border-radius: 0.75rem;
}

/* ==================================================================
   ATMOSPHERE — three fixed depth layers behind all content
   ================================================================== */

/* Layer 1 — radial ice glow bleeding from the top seam */
.landing .ld-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
      58% 44% at 68% -6%,
      oklch(62% 0.15 252 / 0.16),
      transparent 70%
    ),
    radial-gradient(
      42% 34% at 8% 22%,
      oklch(60% 0.12 250 / 0.07),
      transparent 70%
    );
}

/* Layer 2 — instrument grid, masked so it dissolves into the void */
.landing .ld-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: linear-gradient(
      to right,
      oklch(90% 0.02 250 / 0.045) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, oklch(90% 0.02 250 / 0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: radial-gradient(
    ellipse 90% 55% at 60% 0%,
    black 30%,
    transparent 78%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 90% 55% at 60% 0%,
    black 30%,
    transparent 78%
  );
}

/* Layer 3 — film grain at whisper opacity */
.landing .ld-noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Content sits above the atmosphere */
.landing > header,
.landing > main,
.landing > footer {
  position: relative;
  z-index: 1;
}

/* ==================================================================
   MOTION
   ------------------------------------------------------------------
   1. Hero: pure-CSS staggered load reveal (90ms steps). No JS, no
      flash — it runs from first paint.
   2. Below the fold: [data-reveal] elements arm only when JS adds
      .ld-js to <html>; an IntersectionObserver flips .is-in. With
      JS off, content is simply visible.
   3. prefers-reduced-motion disables all of it.
   ================================================================== */

@keyframes ld-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.landing .rise {
  animation: ld-rise 0.8s cubic-bezier(0.21, 0.47, 0.32, 0.98) both;
}
.landing .d-1 { animation-delay: 0.09s; }
.landing .d-2 { animation-delay: 0.18s; }
.landing .d-3 { animation-delay: 0.27s; }
.landing .d-4 { animation-delay: 0.36s; }

/* Eyebrow pulse dot */
@keyframes ld-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}
.landing .ld-pulse {
  animation: ld-pulse 2.6s ease-in-out infinite;
}

/* Scroll reveals — armed by JS only */
html.ld-js .landing [data-reveal] {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.7s cubic-bezier(0.21, 0.47, 0.32, 0.98),
    transform 0.7s cubic-bezier(0.21, 0.47, 0.32, 0.98);
}
html.ld-js .landing [data-reveal].is-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .landing .rise,
  .landing .ld-pulse {
    animation: none;
  }
  html.ld-js .landing [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* ============================ END LANDING ========================= */
