### 🎨 Visual Identity: Safe
- **Palette & Typography:** A highly functional and familiar enterprise interface that prioritizes clarity and immediate trust through standard industry patterns.

## Brand & Style

The design system is engineered for high-performance enterprise recruitment. It adopts a **Corporate / Modern** aesthetic that balances the technical precision of AI with the human-centric nature of hiring. The brand personality is authoritative yet unobtrusive, acting as a sophisticated "glass lens" through which recruiters analyze data.

The visual direction draws from "Safe" enterprise patterns: high information density, strict alignment, and a focus on content over chrome. It avoids decorative distractions, favoring a utilitarian elegance that signals speed, reliability, and institutional trust. The goal is to make complex AI-driven resume scoring feel transparent, evidence-based, and immediately actionable.

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