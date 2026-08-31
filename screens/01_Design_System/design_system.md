---
name: ClaraScreen Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#434655'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#515659'
  on-tertiary: '#ffffff'
  tertiary-container: '#696e71'
  on-tertiary-container: '#edf1f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-performance enterprise recruitment. It adopts a **Corporate / Modern** aesthetic that balances the technical precision of AI with the human-centric nature of hiring. The brand personality is authoritative yet unobtrusive, acting as a sophisticated "glass lens" through which recruiters analyze data.

The visual direction draws from "Safe" enterprise patterns: high information density, strict alignment, and a focus on content over chrome. It avoids decorative distractions, favoring a utilitarian elegance that signals speed, reliability, and institutional trust. The goal is to make complex AI-driven resume scoring feel transparent, evidence-based, and immediately actionable.

## Colors

The palette is anchored by a refined professional blue, utilized strategically for primary actions and focus states. The neutral scale is the foundation of the system, using deep slates for maximum legibility and subtle grays for structural containment.

### Functional Color Application
- **Primary (`#2563EB`):** Reserved for the "North Star" actions: submitting a batch, confirming a hire, or primary navigation indicators.
- **Surface & Background:** The application uses `#FAFAFA` for the main canvas to reduce eye strain, while pure white (`#FFFFFF`) is used for elevated cards and data containers to create a subtle layered effect.
- **Status Indicators:** A semantic system for AI "Match Levels":
    - **Strong Match:** Success Green (`#10B981`)
    - **Good/Consider:** Warning Amber (`#F59E0B`)
    - **Weak/No Match:** Error Red (`#EF4444`)
    - **Processing:** Primary Blue or Neutral Slate with an indeterminate motion state.

## Typography

This design system utilizes **Inter** for all UI and editorial content to ensure maximum readability at small sizes—critical for resume screening and data-heavy tables.

- **Hierarchy:** We use a tight vertical rhythm. Headlines use slight negative letter-spacing to feel more "locked-in" and professional.
- **Data Display:** For AI confidence scores and metadata, `body-sm` and `label-md` are preferred to maintain high information density without sacrificing clarity.
- **Technical Context:** A monospaced font (JetBrains Mono) is used sparingly for technical metadata or specific AI-generated "Reasoning" blocks to distinguish machine-generated logic from human-readable content.

## Layout & Spacing

The system is built on a **fixed-fluid hybrid 8px grid**. Content containers follow a standard 12-column grid on desktop but prioritize "compactness" to ensure recruiters can see as many candidates as possible above the fold.

- **Density:** We utilize "Comfortable," "Compact," and "Dense" spacing modes. The default is **Compact** (16px padding for cards, 8px for list items).
- **Desktop:** 12 columns, 1280px max-width, 24px margins.
- **Tablet:** 8 columns, 16px margins.
- **Mobile:** 4 columns, 16px margins.
- **Alignment:** All elements must align to the 8px baseline. Use `16px` (md) for grouping related items and `32px` (xl) for separating major sections.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-contrast outlines** rather than heavy shadows to convey depth. This keeps the interface feeling "flat" and fast, consistent with modern SaaS tools like Vercel or Linear.

- **Level 0 (Canvas):** `#FAFAFA` — The base layer.
- **Level 1 (Cards/Sidebar):** Pure white `#FFFFFF` with a 1px border of `#E5E7EB`. No shadow.
- **Level 2 (Popovers/Modals):** Pure white `#FFFFFF` with a subtle, diffused ambient shadow: `0 4px 12px rgba(0,0,0,0.05)` and a `#D1D5DB` border.
- **Focus States:** A 2px ring of `primary_color_hex` with an offset to ensure clear keyboard navigation and active selection visibility.

## Shapes

The design system uses a **Rounded** (Level 2) shape language to soften the industrial feel of the data. 

- **Components:** Buttons, Input fields, and small Cards use a `0.5rem` (8px) radius.
- **Large Containers:** Modals and large dashboard panels use `1rem` (16px) for the outer container, with internal elements nested using the standard 8px radius to maintain visual harmony (the "inner radius = outer radius - padding" rule).
- **Interactive Elements:** Checkboxes use a smaller 4px radius to maintain their geometric integrity at small sizes.

## Components

### Buttons
- **Primary:** Solid `#2563EB` with white text. High contrast, 8px radius.
- **Secondary:** White background, `#E5E7EB` border, Slate text. Used for most "soft" actions.
- **Ghost:** No border or background until hover. Used for secondary navigation within tables.

### Data Tables
- **Header:** Sticky, `#F9FAFB` background, `label-md` typography.
- **Rows:** 48px height, 1px bottom border. Hover state uses a subtle `#F1F5F9` tint.
- **Cell Content:** Use `body-sm` for secondary data and `body-md` (Medium weight) for primary candidate names.

### Badges & Chips
- **AI Match Badges:** Small, caps-lock `label-sm`. Use a "Subtle" style: light background tint (10% opacity of status color) with high-contrast text of the same hue.
- **Tagging:** Neutral gray chips for skills (e.g., "React", "Python") to avoid visual competition with status indicators.

### Input Fields
- **Default:** 1px border `#D1D5DB`, 8px radius. Focus state uses a `primary_color` border and a soft blue outer glow.
- **Search:** Persistent search bar in the header with a leading magnifying glass icon and a `cmd+K` kbd shortcut indicator.

### Score Visualization
- **Match Score:** A circular progress indicator or a 100-point bold number. Use semantic coloring based on the Match Levels defined in the Color section.