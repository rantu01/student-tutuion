## Compact Admin UI – Design Guide

This document standardizes the compact table and form patterns used across admin pages like `dashboard/admin/students`, `dashboard/admin/students/enroll`, and `dashboard/admin/students/invite`.

### Typography
- Header title: `text-lg` (~18px)
- Header subtitle: `text-xs` (~12px)
- Table header (`th`): base `text-xs` with explicit `font-size: 10px` via `.table-compact thead th`
- Table cells (`td`): base `text-xs` with explicit `font-size: 11px` via `.table-compact tbody td`
- Secondary meta (chips/hints): `text-[10px]` (10px)

### Iconography
- Action/search/filter icons: `h-3.5 w-3.5` (~14px) for density consistency
- Status/inline cue icons (tiny): `h-3 w-3` (~12px)

### Avatars
- Default avatar size: `h-8 w-8` (32px)

### Core CSS Utilities (defined in `src/app/globals.css`)
- `.table-compact`
  - Full-width compact table with sticky header and hover rows
  - `thead th`: 10px font, compact padding
  - `tbody td`: 11px font, compact padding
- `.table-container`
  - White background, rounded border wrapper
- `.table-responsive`
  - Horizontal overflow wrapper
- `.custom-scrollbar`
  - Nicer scrollbars on supported platforms
- `.form-compact`
  - Compact inputs/selects/buttons: `text-xs`, `py-2`, rounded, blue focus ring

### Layout Pattern
1) Page header card
- Title `text-lg font-bold`, subtitle `text-xs text-gray-600`
- Leading icon at 14px (optional)

2) Filters/Search bar
- Wrapper: `bg-white rounded-lg border border-gray-200 p-4 form-compact`
- Left: search input + filters (status, batch, etc.)
- Right: actions (optional)
- Clear button appears only when a filter is active

3) Table
- Wrapper: `.table-container > .table-responsive > div.max-h-[60vh].overflow-y-auto.custom-scrollbar`
- Table element: `.table-compact`
- Actions column aligned right using `td.actions`

### Buttons (default sizes)
- Primary/secondary buttons: `text-xs px-3 py-2 rounded-lg`
- Inline table actions: compact with `px-2 py-1.5` and `text-xs`

### Pagination
- Keep pagination component unchanged. Ensure surrounding spacing is minimal and uses `text-xs` where applicable.

### Behavioral Rules
- Avoid placeholder/skeleton rows unless explicitly required; render only actual data rows.
- Use `max-h-[60vh]` to constrain table body scroll, not the full page.
- Show “Active filters” chips only when any filter is on; use `text-[10px]` chips.

### Checklist – Applying to a New Page
1) Wrap header in a white card; set title/subtitle sizes.
2) Add a filters bar using the `.form-compact` pattern.
3) Use `.table-container`/`.table-responsive` wrappers and `.table-compact` table.
4) Ensure icons are 14px (`h-3.5 w-3.5`) and fonts are `text-xs` (with 10–11px specifics for table header/cells).
5) Keep inline actions compact with `text-xs` and small paddings.
6) Constrain table with `max-h-[60vh] overflow-y-auto custom-scrollbar`.

### Pages Conforming
- `dashboard/admin/students`: baseline reference
- `dashboard/admin/students/enroll`: aligned
- `dashboard/admin/students/invite`: aligned (uses the same compact filters and table wrappers)

### Admin Dashboard Patterns (`dashboard/admin`)
- Header card: `text-xl` title, `text-sm` subtitle (slightly larger than table pages)
- Stats cards: label `text-xs`, value `text-lg` bold
- Section headers: `text-sm font-bold`
- Links within sections: `text-xs text-gray-600` with hover to `text-gray-900`
- Containers: white cards with `rounded-lg border border-gray-200` and `p-6` or `p-4`
- Quick Actions: grid of bordered cards (`border hover:border-gray-300`) with `text-xs` title/description

### Notes
- Tailwind directives in CSS (`@apply`, `@tailwind`) may trigger IDE warnings; they are expected.
- Avoid arbitrary `text-[11px]` classes in JSX for tables; rely on `.table-compact` CSS to enforce 10px/11px for headers/cells.


