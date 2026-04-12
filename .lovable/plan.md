

# Visual & UX Premium Refinement — Listing Studio AI

## Scope

Three interconnected improvements: (1) Premium visual polish across all UI, (2) UX refinements for speed and clarity, (3) PDF export upgrade.

## 1. Global Visual Upgrade

### CSS & Theme (`src/index.css`)
- Add subtle animated gradient for gold elements
- Add new utilities: `text-gradient-gold`, `card-hover-lift`, `section-divider`
- Refine glass-card with stronger backdrop-blur and refined border opacity
- Add smooth page transitions via `animate-fade-in` and `animate-slide-up`

### MetricCard (`src/components/shared/MetricCard.tsx`)
- Add subtle hover lift animation
- Refine icon container with softer gradient and shadow
- Add trend indicator support (optional up/down arrow)
- Better spacing between label and value

### TopBar (`src/components/TopBar.tsx`)
- Make thinner (h-12), more discrete
- Add subtle bottom shadow instead of hard border
- Refine avatar with gold ring accent
- Add breadcrumb-style current page indicator

### AppSidebar (`src/components/AppSidebar.tsx`)
- Add subtle gradient to sidebar background
- Improve active state with left gold accent bar
- Better spacing between items
- Add hover micro-animation
- Refine footer branding

### DataTable (`src/components/shared/DataTable.tsx`)
- Refined header with lighter weight
- Subtle row hover with left accent
- Better cell padding
- Softer border lines

### Login (`src/pages/auth/Login.tsx`)
- Add background gradient/pattern
- Bigger logo area with brand name in premium typography
- Softer card with more padding
- Add "Listing Studio" watermark/decoration

## 2. Dashboard Refinements

### AgentDashboard (`src/pages/agent/AgentDashboard.tsx`)
- Add welcome greeting with time-of-day
- Better card grid with subtle stagger animation
- Presentation list items with thumbnail preview dots
- Quick action buttons row below metrics

### AdminDashboard (`src/pages/admin/AdminDashboard.tsx`)
- Refine metric grid spacing
- Better section headers with gold accent line
- Table polish via shared DataTable improvements

## 3. Wizard UX Improvements

### WizardStepper (`src/components/wizard/WizardStepper.tsx`)
- Larger step circles with smoother transitions
- Add step description text below labels
- Animated progress line between steps
- Better active state with pulse animation

### StepPropertyData (`src/components/wizard/StepPropertyData.tsx`)
- Group cards with section icons in headers
- Collapsible optional sections (CEP, condominium, notes)
- Better grid layout for characteristics (3 cols on desktop)
- Currency input formatting for price field
- Photo upload area with drag-drop visual cue

### StepLayoutStyle (`src/components/wizard/StepLayoutStyle.tsx`)
- Add mini preview thumbnail for each layout
- Larger selection cards with better selected state (gold border glow)
- Tone selector with colored accent per tone

### StepGeneration (`src/components/wizard/StepGeneration.tsx`)
- Add subtle particle/sparkle animation during generation
- Larger progress bar with gradient fill
- Success state with confetti-style celebration
- Better stage cards with animated check transition

## 4. Editor & Presentation Polish

### EditorToolbar (`src/components/editor/EditorToolbar.tsx`)
- Group actions into logical clusters with subtle dividers
- Add keyboard shortcut hints on hover
- Gold accent for primary actions (Save, AI)

### SlidesSidebar (`src/components/editor/SlidesSidebar.tsx`)
- Add mini slide preview (colored strip or icon per section type)
- Better selected state with left gold bar
- Drag handle with subtle grip pattern
- Slide counter badge

### EditPanel (`src/components/editor/EditPanel.tsx`)
- Section header with icon and type label
- Better field grouping with dividers
- Subtle animations on section switch

### PresentationEditor (`src/pages/agent/PresentationEditor.tsx`)
- Better preview area background (subtle grid pattern)
- Shadow and frame around preview slide for "printed" feel
- Smooth transition between slides

### PresentationMode (`src/pages/agent/PresentationMode.tsx`)
- Smoother slide transitions (fade/slide animation)
- Better progress bar with slide dots
- Refined control overlay with glassmorphism

## 5. Layout Refinements (Slide Rendering)

### LayoutExecutivo (`src/components/layouts/LayoutExecutivo.tsx`)
- Add subtle top accent line per section
- Better property grid with refined borders
- Softer backgrounds, refined spacing
- Cover with geometric accent elements

### LayoutPremium (`src/components/layouts/LayoutPremium.tsx`)
- Richer gradients with overlay patterns
- Gold dividers between content blocks
- Better typography hierarchy (larger headings, more letter-spacing)
- Property stats in elegant pill style

### LayoutImpactoComercial (`src/components/layouts/LayoutImpactoComercial.tsx`)
- Bolder accent badges
- Better card glass effects on dark sections
- Stronger visual hierarchy for results/numbers
- CTA-style closing with button-like element

## 6. PDF Export Upgrade

### `supabase/functions/export-pdf/index.ts`
- Refined cover page with gradient header and logo
- Better section page breaks with branded header/footer per page
- Pricing scenarios in visually distinct cards with colors
- Property summary with structured grid
- Better text/image balance with proper spacing
- Professional typography (larger headings, comfortable line height)
- Footer with page numbers and branding

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | New utilities, animations, refined tokens |
| `src/components/shared/MetricCard.tsx` | Hover lift, refined icon, spacing |
| `src/components/shared/DataTable.tsx` | Refined header, hover, padding |
| `src/components/TopBar.tsx` | Thinner, shadow, breadcrumb |
| `src/components/AppSidebar.tsx` | Gold active bar, spacing, gradient |
| `src/components/AppLayout.tsx` | Background pattern on main area |
| `src/pages/auth/Login.tsx` | Background, bigger brand, polish |
| `src/pages/agent/AgentDashboard.tsx` | Greeting, animations, quick actions |
| `src/pages/admin/AdminDashboard.tsx` | Section headers, spacing |
| `src/components/wizard/WizardStepper.tsx` | Larger steps, animation, descriptions |
| `src/components/wizard/StepPropertyData.tsx` | Section icons, collapsible, currency |
| `src/components/wizard/StepLayoutStyle.tsx` | Glow selection, larger cards |
| `src/components/wizard/StepGeneration.tsx` | Sparkle animation, gradient progress |
| `src/components/editor/EditorToolbar.tsx` | Action groups, shortcuts, gold accents |
| `src/components/editor/SlidesSidebar.tsx` | Mini previews, gold active bar |
| `src/components/editor/EditPanel.tsx` | Section icon, field grouping |
| `src/pages/agent/PresentationEditor.tsx` | Preview frame, transitions |
| `src/pages/agent/PresentationMode.tsx` | Slide transitions, glass controls |
| `src/components/layouts/LayoutExecutivo.tsx` | Accent lines, refined grids |
| `src/components/layouts/LayoutPremium.tsx` | Richer gradients, gold dividers |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Bolder accents, glass cards |
| `supabase/functions/export-pdf/index.ts` | Premium cover, headers, scenarios cards |

