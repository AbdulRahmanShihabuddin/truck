# Design System Specification: High-End Editorial

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**
This design system rejects the frantic, "utility-first" aesthetic common in logistics software. Instead, it adopts the posture of a prestigious archive or a high-end editorial journal. By treating trucking hours-of-service and trip planning data as "curated content" rather than "log entries," we instill a sense of calm, intelligence, and high-trust authority.

We break the "standard SaaS" look through **intentional asymmetry** and **tonal depth**. The layout relies on generous whitespace (breathing room) and a strict hierarchy where serif typography handles the narrative of the journey, while precise sans-serifs manage the utility of the data.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, scholarly blue and a "curatorial gold." The objective is to create a sophisticated environment that feels stable and timeless.

### The "No-Line" Rule
**Traditional 1px borders are strictly prohibited for sectioning or containment.** We define boundaries through background color shifts. By utilizing the Material surface scale, we create hierarchy through "Value" (lightness/darkness) rather than "Stroke."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of heavyweight cotton paper.
*   **Base Layer:** `surface` (#faf8ff) for the main canvas.
*   **Secondary Content:** Use `surface-container-low` (#f3f3fc) to group related information.
*   **Interactive Cards:** Use `surface-container-lowest` (#ffffff) to make elements "pop" against a slightly darker background.
*   **Emphasis/Recess:** Use `surface-dim` (#d9d9e2) for background utility areas or sidebars that should feel "set back" from the main stage.

### The "Glass & Gradient" Rule
To ensure the system feels premium and not just "flat," we utilize:
*   **Signature Textures:** Primary actions must use a subtle linear gradient from `primary` (#003686) to `primary_container` (#094cb2). This provides a "soft-lit" depth that flat hex codes cannot achieve.
*   **Archival Highlights:** Use `tertiary` (#6d5e00) sparingly—only for high-level metadata, historical "archival" flags, or "gold-standard" status indicators.

---

## 3. Typography
Typography is our primary tool for conveying "High-End Editorial." 

| Level | Token | Font Family | Character |
| :--- | :--- | :--- | :--- |
| **Display** | `display-lg/md/sm` | **Noto Serif** | Authoritative, scholarly headlines. |
| **Headline** | `headline-lg/md/sm` | **Noto Serif** | Narrative section headers; provides the "voice." |
| **Title** | `title-lg/md/sm` | **Inter** | Strong utility headers; used for trip legs or names. |
| **Body** | `body-lg/md/sm` | **Inter** | Highly readable, neutral for long-form data. |
| **Label** | `label-md/sm` | **Public Sans** | Archival metadata, mono-like precision for timestamps. |

**Editorial Emphasis:** Use Noto Serif Italic for narrative tooltips or "status summaries" to create a distinct curatorial voice within the trip planner.

---

## 4. Elevation & Depth
In this system, depth is felt, not seen. We move away from heavy "material" shadows in favor of tonal layering and light refraction.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-high` (#e7e7f1) section to create a natural "lift."
*   **Ambient Shadows:** If a floating element (like a modal) requires a shadow, it must be ultra-diffused. Use a 32px to 64px blur at 6% opacity, tinted with the `on-surface` color.
*   **The "Ghost Border" Fallback:** For input fields or essential containment, use a "Ghost Border": `outline-variant` (#c3c6d5) at **15% opacity**. This provides a hint of structure without interrupting the editorial flow.
*   **Glassmorphism:** Floating menus and navigation overlays must use **80% opacity** of the surface color with a **20px backdrop-blur**. This allows the "journey" (background content) to bleed through the interface, maintaining context.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`). `on-primary` text. `sm` (0.125rem) or `md` (0.375rem) corners.
*   **Secondary:** Solid `secondary_container` with `on-secondary-container` text. No border.
*   **Tertiary/Ghost:** No container. Use `primary` text. For use in dense data tables or secondary actions.

### Input Fields
*   **Styling:** Background of `surface-container-lowest`. A "Ghost Border" (15% opacity `outline-variant`).
*   **Focus State:** The border transitions to 100% opacity `primary`, and the background shifts to `surface-bright`.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Execution:** Use `40px` or `48px` of vertical white space to separate list items. Use a `surface-container-low` background on hover to indicate interactivity.
*   **Trip Leg Cards:** Use `surface-container-lowest` with a thick `tertiary` (gold) left-accent bar (4px) to denote "Curated/Active" status.

### Trip Planner Timeline (Contextual Component)
*   Instead of a standard "progress bar," use a thin line of `surface-dim` with `tertiary` (gold) dots for stops. Label the stops using `label-sm` (Public Sans) for a technical, archival feel.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts (e.g., a wide left margin for a headline, with content pushed right) to mimic premium magazine layouts.
*   **Do** use `Noto Serif` for any text that feels like "the computer talking to the user" (narrative).
*   **Do** use `Public Sans` for any text that is "raw data" (HOS clocks, GPS coordinates).

### Don’t
*   **Don’t** use pure black (#000000) for text. Always use `on-surface` (#191b22) to maintain a soft, ink-on-paper feel.
*   **Don’t** use 1px solid borders to separate sidebar from main content; use a background shift to `surface-container`.
*   **Don’t** use "loud" animations. Transitions should be slow (300ms+) and use "Standard Decelerate" easing to maintain a calm, intelligent atmosphere.