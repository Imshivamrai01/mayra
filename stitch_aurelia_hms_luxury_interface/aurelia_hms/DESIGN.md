---
name: Hotel Amara
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#4e4540'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#7f756f'
  outline-variant: '#d1c4bd'
  surface-tint: '#685c55'
  primary: '#170f0a'
  on-primary: '#ffffff'
  primary-container: '#2d241e'
  on-primary-container: '#988a82'
  inverse-primary: '#d3c3ba'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#190f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#332300'
  on-tertiary-container: '#aa8843'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f0dfd6'
  primary-fixed-dim: '#d3c3ba'
  on-primary-fixed: '#221a14'
  on-primary-fixed-variant: '#4f453e'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#e9c176'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4201'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  display-md-mobile:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 40px
  container-max: 1440px
  density-compact: 8px
  density-comfortable: 16px
---

## Brand & Style

The design system is rooted in the "New Luxury" aesthetic—moving away from ostentatious gold leaf toward a refined, understated, and editorial atmosphere. It is designed specifically for luxury hospitality management, where the UI must feel as sophisticated as the properties it manages.

The style is **Minimalist Editorial**. It prioritizes high-quality typography, generous but structured whitespace, and a monochromatic foundation punctuated by metallic accents. The interface avoids traditional "dashboard" tropes in favor of a layout that resembles a premium lifestyle magazine or a high-end concierge ledger. The emotional response is one of calm authority, precision, and timeless elegance.

## Colors

The palette is anchored by a warm, organic foundation to avoid the sterile feel of typical enterprise software.

- **Primary (Espresso):** Used for all primary text, deep-tone iconography, and high-emphasis borders. It provides the "ink" on the page.
- **Accent (Champagne & Gold):** Used sparingly for call-to-action elements, active states, and premium indicators. These should never be used for large surfaces.
- **Background (Ivory):** The primary canvas for all pages. It is warmer than pure white, reducing eye strain during long shifts.
- **Secondary Surface (Taupe):** Used for sidebars, utility panels, and subtle grouping of data fields to create soft contrast without harsh lines.

## Typography

Typography is the primary vehicle for the brand’s luxury positioning. 

- **Display & Headings:** Use the Serif typeface for all page titles, section headers, and guest names. This creates the "Editorial" feel.
- **UI & Data:** Use the Sans-serif typeface for all functional elements, data tables, and navigation. 
- **Hierarchy:** Use the `label-caps` style for table headers and small metadata to maintain a clean, organized grid. 
- **Contrast:** Always pair large Serif headings with smaller, tightly tracked Sans-serif labels to achieve a high-fashion aesthetic.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system for desktop (12 columns) to ensure that information remains legible and doesn't stretch awkwardly on ultra-wide monitors used at front desks.

- **Information Density:** Despite the luxury feel, this is an ERP. Use a 4px baseline grid. Data-heavy views (Room Grids, Folios) should use `density-compact` (8px) for internal padding, while marketing or landing screens use `density-comfortable`.
- **Refining Whitespace:** Use large outer margins (40px+) to frame the content, making the software feel like an open book rather than a cramped spreadsheet.
- **Mobile:** Transition to a fluid single-column layout with 16px side margins.

## Elevation & Depth

This design system avoids heavy shadows and floating layers, favoring a "layered paper" approach.

- **Tonal Layers:** Depth is primarily communicated through color shifts (e.g., a Taupe panel sitting on an Ivory background).
- **Thin Outlines:** Use 1px solid borders in a slightly darker shade of Taupe or a 15% opacity Espresso to define boundaries.
- **Ambient Shadows:** Only use shadows for temporary floating elements like dropdown menus or modals. Shadows should be very large in blur (20px+) but very low in opacity (5-8%) with a slight brown tint (#2D241E) to maintain warmth.

## Shapes

The shape language is architectural and precise. 

- **Corners:** Use a strict 4px (`rounded-sm`) or 6px (`rounded-md`) radius. This provides just enough softness to feel modern while retaining the formal structure of a luxury brand.
- **Interactive Elements:** Buttons and input fields should follow the same 4px rule. Avoid pill-shaped buttons as they appear too casual for a professional ERP environment.

## Components

- **Buttons:** Primary buttons are solid Espresso with Ivory text. Secondary buttons use a 1px Espresso border with no fill. For "Premium" actions (e.g., "Upgrade Guest"), a muted Gold fill is permitted.
- **Input Fields:** Use "Ghost" styling—no background fill, only a bottom border (1px) that becomes a full 4-sided border on focus. Labels should use the `label-caps` typography.
- **Data Tables:** Remove vertical grid lines. Use horizontal rules only. The header row should have a soft Taupe background.
- **Status Chips:** Instead of bright traffic-light colors, use muted tones (e.g., Sage for 'Checked In', Dusty Rose for 'Dirty', Slate for 'Reserved'). Use a subtle border and the `label-caps` font.
- **Cards:** Cards should not have shadows. Use a 1px Taupe border or a simple background color change to Ivory-White against the Taupe page background.
- **Icons:** Use 1.5pt stroke weight line icons. Avoid filled icons unless they represent an active toggle state.