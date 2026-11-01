<!-- ponytail: aligned design tokens directly with Catppuccin Macchiato palette -->
# GitBoard Design System

## Overview

GitBoard is a repository-structured, diff-inspired design system for Git workflow tools and code review platforms. It centers around the familiar addition/deletion color coding of diffs, using Catppuccin Macchiato's green and red as functional primaries rather than decorative choices. The compact layout is optimized for scanning code changes, reviewing pull requests, and navigating repository structures. Every component draws from the mental model of version control, making the interface instantly recognizable to developers.

---

## Colors (Catppuccin Macchiato)

- **Primary** (#A6DA95): Green — additions, approvals, merged PRs
- **Secondary** (#ED8796): Red — deletions, rejections, conflicts
- **Tertiary** (#8AADF4): Blue — links, active selection, branch references
- **Accent** (#C6A0F6): Mauve — badges, tags, special highlights
- **Background** (#24273A): Base — main page canvas (Mantle #1E2030, Crust #181926)
- **Surface** (#363A4F): Surface 0 — cards, panels, file viewers (Surface 1 #494D64, Surface 2 #5B6078)
- **Text** (#CAD3F5): Text — primary reading text (Subtext 1 #B8C0E0, Subtext 0 #A5ADCB)
- **Border / Divider** (#494D64): Surface 1 / Overlay 0 (#6E738D) — outlines, rules, separators
- **Success** (#A6DA95): Green — merged, checks passed, additions
- **Warning** (#EED49F): Yellow / Peach (#F5A97F) — pending review, draft PR
- **Error** (#ED8796): Red — checks failed, conflicts, deletions
- **Info** (#7DC4E4): Sapphire / Blue (#8AADF4) — open PRs, comments, info notes

## Typography

- **Headline Font**: Space Grotesk
- **Body Font**: DM Sans
- **Mono Font**: JetBrains Mono

- **Display**: Space Grotesk 36px bold, 1.15 line height, 0.02em tracking
- **Headline**: Space Grotesk 26px bold, 1.2 line height, 0.01em tracking
- **Subhead**: Space Grotesk 20px semibold, 1.3 line height
- **Body Large**: DM Sans 16px regular, 1.6 line height
- **Body**: DM Sans 14px regular, 1.6 line height
- **Body Small**: DM Sans 13px regular, 1.5 line height, 0.01em tracking
- **Caption**: DM Sans 12px medium, 1.4 line height, 0.01em tracking
- **Overline**: DM Sans 11px semibold, 1.4 line height, 0.06em tracking
- **Code**: JetBrains Mono 13px regular, 1.6 line height

---

## Spacing

- **Base unit:** 4px (compact)
- **Scale:** `4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px`
- **Component padding:** Buttons `8px 14px`, Cards 16px, Inputs `8px 12px`
- **Section spacing:** 32px between sections, 48px for page headers
- **Diff line height:** 20px fixed for consistent diff viewing
- **File tree indent:** 16px per depth level

## Border Radius

- **None** (0px): Diff lines, code blocks (inner)
- **Small** (3px): Inline code, tiny badges
- **Medium** (6px): Cards, buttons, inputs, panels
- **Large** (8px): Modal containers, dropdown menus
- **XL** (12px): Feature cards, onboarding
- **Full** (9999px): Avatars, status indicators, pill labels

## Elevation

GitBoard uses a flat aesthetic with borders. Shadows are reserved for floating elements.
- **Subtle**: None (use 1px #363A4F). Cards, file viewers, tables.
- **Medium**: 2px offset, 6px blur, rgba(24, 25, 38, 0.4) (#181926 at 40%). Dropdown menus, popovers.
- **Large**: 8px offset, 24px blur, rgba(24, 25, 38, 0.6) (#181926 at 60%). Modals, command palette.
- **Overlay**: 9999px ring rgba(24, 25, 38, 0.75). Backdrop behind modals.
- **Diff**: `inset 3px 0 0` (color varies). Diff line change indicator bar.
Diff shadow colors: additions `inset 3px 0 0 #A6DA95`, deletions `inset 3px 0 0 #ED8796`, unchanged None.

## Components

### Buttons
- **Primary**: #A6DA95 fill, #1E2030 text, no border. Hover: #8BD5CA bg.
- **Secondary**: #363A4F fill, #CAD3F5 text, 1px #494D64 border. Hover: #494D64 bg.
- **Ghost**: Transparent fill, #A5ADCB text, no border. Hover: #363A4F bg, #CAD3F5 text.
- **Destructive**: #ED8796 fill, #1E2030 text, no border. Hover: #EE99A0 bg.
- **Sizes**: Small `28px h / 6px 10px pad`, Medium `34px h / 8px 14px pad`, Large `42px h / 10px 22px pad`
- **Disabled**: 40% opacity, disabled cursor, no hover state change
- **Merge button**: Primary green (#A6DA95) with merge icon, 6px radius

### Cards
- **Default**: #1E2030 fill, 1px #363A4F border, no shadow. Hover: border-color: #494D64.
- **Elevated**: #1E2030 fill, 1px #363A4F border, 0 4px 18px rgba(0, 0, 0, 0.28) shadow. Hover: border-color: #8AADF4.
Padding: 16px. Border radius: 6px.

### Inputs
- **Default**: 1px #494D64 border, #181926 fill, #CAD3F5 text, #A5ADCB label color.
- **Hover**: 1px #5B6078 border, #181926 fill, #A5ADCB label color.
- **Focus**: 2px #8AADF4 border, #181926 fill, #8AADF4 label color.
- **Error**: 2px #ED8796 border, #181926 fill, #ED8796 label color.
- **Disabled**: 1px #363A4F border, #24273A fill, #6E738D label color.
- **Label**: DM Sans 13px/500, positioned above with 4px gap.
- **Helper text**: DM Sans 12px/400 in #A5ADCB, error helper in #ED8796.
- **Search/filter**: 6px radius, magnifier prefix, #1E2030 background.

### Chips
- **Filter**: #363A4F fill, #CAD3F5 text, 1px #494D64 border, pill shape.
- **Status**: varies fill, varies text, no border, pill shape.
- **PR status badges**:
  - Open: rgba(138, 173, 244, 0.15) bg / #8AADF4 text, 1px rgba(138, 173, 244, 0.3) border
  - Merged: rgba(166, 218, 149, 0.15) bg / #A6DA95 text, 1px rgba(166, 218, 149, 0.3) border
  - Closed: rgba(237, 135, 150, 0.15) bg / #ED8796 text, 1px rgba(237, 135, 150, 0.3) border
  - Draft: rgba(110, 115, 141, 0.2) bg / #A5ADCB text, 1px #494D64 border

### Lists
DM Sans 14px/400 for lists, JetBrains Mono 13px/400 for diff text. 40px (file list), 20px (diff lines) row height, 1px #363A4F divider, #363A4F hover background, rgba(138, 173, 244, 0.12) background with #8AADF4 left 2px border active/selected, addition rgba(166, 218, 149, 0.12), deletion rgba(237, 135, 150, 0.12), unchanged transparent / #24273A diff backgrounds, JetBrains Mono 12px/400 in #6E738D, 48px gutter width line numbers.

### Checkboxes
16px square, 3px radius, 1.5px #5B6078 border, #181926 fill. 8px label gap. Checked: #8AADF4 fill, #181926 checkmark. Indeterminate: #8AADF4 fill, #181926 dash. Disabled: #363A4F fill, #494D64 border.

### Radio Buttons
16px circle, 1.5px #5B6078 border, #181926 fill. 8px label gap. Selected: #8AADF4 outer ring, #8AADF4 inner dot (6px). Disabled: #363A4F fill, #494D64 border.

### Tooltips
#181926 fill, 1px #363A4F border, #CAD3F5 text, DM Sans 12px/400, 4px border radius, 2px offset, 6px blur, rgba(0, 0, 0, 0.4) shadow. `4px 8px` padding, 4px CSS triangle arrow, 240px max width.

---

## Do's and Don'ts

1. **Do** use green (#A6DA95) exclusively for additions, approvals, and merged states; red (#ED8796) for deletions, failures, and rejections.
2. **Do** render all code content in JetBrains Mono at 13px with `1.6` line height for diff readability.
3. **Do** use the `inset 3px 0 0` left-border pattern for diff line change indicators.
4. **Don't** swap green and red semantics; developers have strong expectations for these colors in git contexts.
5. **Don't** use shadows on file viewers or diff panels; flat borders keep the interface clean and scannable.
6. **Don't** exceed 14px for body text in compact views; the 4px-base system demands restraint.
7. **Do** provide clear PR status badges using the defined pill-shaped status chip system.
8. **Don't** use display-size typography for repository names; subhead is the maximum size in list contexts.
9. **Do** maintain the 20px fixed line height for all diff view lines to ensure alignment.
10. **Don't** apply colored backgrounds to more than the changed lines in a diff; context lines stay base background (#24273A).
