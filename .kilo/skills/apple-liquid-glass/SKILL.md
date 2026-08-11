---
name: Apple Liquid Glass & High-End SaaS Product Design
description: Advanced architectural and implementation guidelines for Apple Liquid Glass UI, crafted for tier-1 high-mrr ($10k+ value aesthetic) SaaS products. Eliminates AI design slop in favor of precise, tactile, production-ready interfaces.
---

## Core Philosophy: The $10,000 SaaS Standard

High-end SaaS software feels expensive not because of excessive effects, but because of **obsessive visual precision, density control, micro-interactions, and spatial physics**.

1. **Precision Over Decoration** — Every line, border, inner shadow, and tint must serve structural hierarchy. Never add a blur or gradient just to "fill space."
2. **Tactile Material Logic** — Glass is not just a `backdrop-filter`; it is an optical surface with physical refraction, subtle edge-highlights, depth gradients, and ambient occlusion.
3. **Information Density & Utility** — Enterprise/pro software needs to present complex data cleanly. Aesthetics must NEVER degrade contrast, scanability, or keyboard/cursor speed.
4. **Anti-Slop Constraint** — Strictly ban floaty, ungrounded cards, generic pastel gradient blobs, oversized cartoonish radius padding, and low-contrast grey-on-grey copy.

---

## Liquid Glass Architecture & Optical Physics

Real liquid glass is defined by light bending at boundaries and chromatic edge behavior. Standard CSS backdrop-filters look flat without multi-layered specular highlights.

### Glass Specular Hierarchy

- **Top Rim (Key Light):** A sharp 1px multi-stop inner highlight (`inset 0 1px 0 0`) simulating direct overhead studio light.
- **Bottom Rim (Ambient Light):** A subtle dark tint or subtle soft line (`inset 0 -1px 0 0`) providing structural floor anchoring.
- **Surface Refraction:** A subtle radial/linear backdrop tint with noise or micro-grain to prevent visual banding on dark displays.

### Material Grading Table

| Tier             | Usage Target                    | Opacity / Tint                                                 | Blur / Saturation                | Border / Highlight Strategy                                                |
| :--------------- | :------------------------------ | :------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------- |
| **Thin Glass**   | Floating Toolbar, Context Menus | Light: `rgba(255,255,255,0.45)`<br>Dark: `rgba(15,17,23,0.55)` | `blur(20px)`<br>`saturate(180%)` | `1px solid rgba(255,255,255,0.3)`<br>Top highlight `rgba(255,255,255,0.6)` |
| **Medium Glass** | Modal Sheets, Dropdowns, Cards  | Light: `rgba(255,255,255,0.70)`<br>Dark: `rgba(22,25,35,0.75)` | `blur(32px)`<br>`saturate(160%)` | `1px solid rgba(255,255,255,0.15)`<br>Dual inset rim shadow                |
| **Thick Glass**  | Key Navigation, Sidebar Panel   | Light: `rgba(248,249,252,0.88)`<br>Dark: `rgba(10,12,16,0.92)` | `blur(48px)`<br>`saturate(140%)` | Micro-stroke `rgba(255,255,255,0.08)`<br>Subtle noise texture              |

---

## Anti-Slop Strict Rules (The 10 Commandments)

1. **NO Pure White/Black Borders on Glass** — Never use `border: 1px solid #fff` or `border: 1px solid #000`. Use dynamic alpha mixing (`rgba` / `color-mix`) so borders blend with underlying content.
2. **NO Oversized Border Radii** — Avoid `32px+` border radius on small interactive components or data tables. Reserve continuous super-ellipse curves (`squircle`) strictly to Apple standards: `8px-12px` for controls, `16px-20px` for cards/modals.
3. **NO Decorative Floating Blobs** — Do not place random blurred gradient circles behind cards. Background depth must come from actual content layering, subtle grid textures, or context-driven light passes.
4. **NO Low-Contrast Secondary Labels** — Secondary text must pass WCAG AA standards (minimum 4.5:1). Never drop opacity below 60% on light glass or 65% on dark glass.
5. **NO Unanchored Shadows** — Ambient drop shadows MUST use multiple layered box-shadow steps (e.g., key shadow + ambient spread) with a subtle hue tint matching the surface underneath.
6. **Mandatory Specular Highlight** — Every primary floating glass element MUST feature a 1px top inner specular highlight line simulating physical edge refraction.
7. **Squircle Corners Always** — Web projects must utilize mask-images or CSS Houdini/Tailwind smooth squircle plugins (`corner-shape: superellipse` where supported, or proper SVG clip-paths) to avoid rigid geometric arcs.
8. **Subtle Grain for Depth** — Dark glass surfaces MUST include a 2-3% opacity SVG noise filter to prevent display color banding and create tactile physical depth.
9. **Instant Active States** — Hover transitions can be springy (200-300ms), but click/active states must trigger instantly (<80ms) with tactile depression (scale to `0.985` or `inset shadow`).
10. **Keyboard & Focus First** — High-end SaaS apps require zero-mouse operation. All glass components require crisp 2px focus rings (`offset-2`) with high-contrast accent ring colors.

---

## High-End SaaS Typography & Layout Architecture

### Hierarchy & Metrics

- **Font Stack:** SF Pro Display (Headers), SF Pro Text (Body/UI), SF Mono / JetBrains Mono (Data/Metrics/Code).
- **Tabular Numerics:** All numbers, financial metrics, counters, and dates MUST use `font-variant-numeric: tabular-nums` or `monospaced-digit`.
- **Letter Spacing:**
  - Display / Big Headlines (`32px+`): `-0.022em` to `-0.035em` (tight, crisp)
  - UI Labels / Small Caps (`10px-12px`): `+0.04em` to `+0.08em` (expanded, uppercase)

### SaaS Micro-Components Layout

- **Status Pills:** Continuous curve, 1px micro-border, 6px internal dot indicator with `ping`/`glow` micro-animation.
- **Action Toolbars:** Segmented glass control with smooth sliding background pill highlight driven by spring physics.

---

## Production-Ready Implementation Code

### 1. Web / CSS & Tailwind Architecture

```css
/* Custom SaaS Glass Utility Classes */
:root {
  --glass-border-light: rgba(255, 255, 255, 0.4);
  --glass-border-dark: rgba(255, 255, 255, 0.08);
  --glass-specular-light: rgba(255, 255, 255, 0.8);
  --glass-specular-dark: rgba(255, 255, 255, 0.15);
}

.saas-glass-card {
  position: relative;
  background: color-mix(
    in srgb,
    var(--surface-bg, rgba(18, 20, 29, 0.75)) 85%,
    transparent
  );
  backdrop-filter: blur(24px) saturate(170%);
  -webkit-backdrop-filter: blur(24px) saturate(170%);
  border-radius: 16px;

  /* Precision Specular Edge Lighting */
  border: 1px solid var(--glass-border-dark);
  box-shadow: 
    /* Specular Top Rim Highlight */
    inset 0 1px 0 0 var(--glass-specular-dark),
    /* Soft Inner Bottom Ambient Anchor */ inset 0 -1px 0 0 rgba(0, 0, 0, 0.3),
    /* Multi-layered SaaS Drop Shadows */ 0 4px 6px -1px rgba(0, 0, 0, 0.2),
    0 12px 24px -4px rgba(0, 0, 0, 0.35);

  transition:
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.2s ease;
}

.saas-glass-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 0 rgba(0, 0, 0, 0.3),
    0 8px 16px -2px rgba(0, 0, 0, 0.25),
    0 20px 32px -4px rgba(0, 0, 0, 0.4);
}

.saas-glass-card:active {
  transform: translateY(0px) scale(0.992);
}
```
