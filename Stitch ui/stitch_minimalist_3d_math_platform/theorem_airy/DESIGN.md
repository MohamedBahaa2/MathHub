# Design System Document: The Mathematical Sanctuary

## 1. Overview & Creative North Star
**Creative North Star: "The Ethereal Equation"**

This design system moves away from the "industrial" look of traditional education platforms, opting instead for a "Mathematical Sanctuary." The goal is to reduce cognitive load by treating the UI as a series of light-filled, ethereal spaces. By leveraging glassmorphism, high-contrast editorial typography, and intentional asymmetry, we transform math from a rigid subject into a fluid, approachable experience.

We break the "template" look through **Tonal Composition**. Instead of traditional boxes, we use overlapping "frosted" layers and significant white space to create a sense of intellectual breathing room.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a spectrum of sophisticated neutrals, punctuated by high-energy violets and blues that signify focus and momentum.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define space, designers must use background shifts. For example, a lesson card (`surface-container-lowest`) should sit on a `surface-container-low` background. The boundary is perceived through the change in value, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine vellum and frosted glass:
*   **Base Layer:** `surface` (#f5f7f9) – The expansive "desk" everything sits on.
*   **Secondary Sections:** `surface-container-low` (#eef1f3) – Large content blocks.
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) – High-focus interactive elements.
*   **Floating Navigation:** `surface-bright` (#f5f7f9) with 80% opacity and a 20px backdrop blur.

### Signature Textures
To add "soul," use a **Subtle Kinetic Gradient** for primary actions. Transition from `primary` (#4a40e0) to `primary-container` (#9795ff) at a 135-degree angle. This provides a sense of depth and energy that flat color cannot replicate.

---

## 3. Typography
We utilize a dual-typeface system to balance technical precision with editorial elegance.

*   **Display & Headlines (Manrope):** Chosen for its geometric purity. Manrope’s open apertures make large-scale math problems and chapter titles feel modern and expansive.
    *   *Usage:* Use `display-lg` for progress percentages and `headline-md` for lesson titles.
*   **Body & Labels (Inter):** The workhorse for readability. Inter is used for all instructional text and complex formulas to ensure zero ambiguity.
    *   *Hierarchy Hint:* Use `title-lg` for section headers and `body-md` for lesson content. Always maintain high contrast using `on-surface` (#2c2f31) against light backgrounds.

---

## 4. Elevation & Depth
In this system, depth is a functional tool used to guide the student’s focus toward the current "step" in a problem.

### The Layering Principle
Achieve lift through color stacking. A floating math keyboard should use `surface-container-highest` to feel "closer" to the user, while the problem statement remains on `surface-container-low`.

### Ambient Shadows
When an element must "float" (e.g., a modal or a floating action button):
*   **Shadow Color:** Use a 6% opacity version of `on-surface` (#2c2f31).
*   **Blur:** Minimum 32px to 64px.
*   **Spread:** -4px to ensure the shadow feels tucked under the element, mimicking soft, overhead studio lighting.

### The "Ghost Border" Fallback
If accessibility requirements (WCAG) demand a border, use the `outline-variant` (#abadaf) at **15% opacity**. This creates a "hint" of a container without breaking the ethereal aesthetic.

---

## 5. Components

### Buttons
*   **Primary:** A gradient-fill (`primary` to `primary-container`) with `xl` (1.5rem) rounded corners. Text is `on-primary` (#f4f1ff).
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text, shifts to `surface-container-low` on hover.

### Input Fields (The "Math Cell")
*   **Style:** Minimalist underline or soft-tinted block.
*   **State:** Default uses `surface-container-high`. On focus, transition to `surface-container-lowest` with a subtle `primary` glow (4px blur, 10% opacity).
*   **Error:** Use `error` (#b41340) for text and `error_container` (#f74b6d) for a soft background tint behind the input.

### Progress Cards
*   **Style:** Forbid divider lines. Use `md` (0.75rem) vertical spacing to separate "Lesson Name" from "Time Remaining."
*   **Interactive State:** On hover, a card should shift from `surface-container-low` to `surface-container-lowest` and gain an ambient shadow.

### Mathematical Expression Trays
*   **Style:** Use **Glassmorphism**. A container with `surface_variant` at 40% opacity and a heavy `backdrop-filter: blur(12px)`. This allows the student to see the "work" behind the tray while focusing on the tools.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts for Hero sections (e.g., text aligned left, abstract geometric shapes floating off-grid to the right).
*   **Do** use `primary_fixed_dim` for "Solved" states to provide a calming, successful visual cue.
*   **Do** prioritize `xl` (1.5rem) corner radius for large containers to maintain the "Soft-UI" approach.

### Don't
*   **Don't** use 100% black text. Always use `on-surface` (#2c2f31) to keep the look high-end and avoid "ink-bleed" visual fatigue.
*   **Don't** use 1px solid borders to separate list items. Use 16px of vertical white space or a subtle change to `surface-container-low`.
*   **Don't** use standard "Drop Shadows" (dark, tight, high-opacity). If it looks like a 90s web element, increase the blur and decrease the opacity.