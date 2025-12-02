# Window Architecture Comparison & Refactoring Strategy

## 1. Introduction
This document compares the window architecture of **RPG Maker MZ (RMMZ)**, the **Current Engine Implementation**, and the **Proposed Refactoring**. The goal is to identify the best approach for a modular, customizable, and code-driven window system that leverages the current engine's web technologies while providing the **rigid precision** and control familiar to RMMZ developers.

## 2. RPG Maker MZ Architecture (The Reference)
RMMZ uses a **Canvas/WebGL** rendering pipeline (via PIXI.js). Windows are containers that draw text and sprites onto a bitmap using absolute coordinates.

### Characteristics
*   **Rendering:** Immediate-mode style drawing. Content is "painted" onto a `contents` Bitmap.
*   **Positioning:** **Absolute Coordinates**. Every element (text, icon, gauge) requires explicit `x`, `y`, `width`, and `height` calculations.
*   **Structure:**
    *   `Window_Base`: Handles the frame, background, and helper methods (`drawText`, `drawIcon`).
    *   `Window_Selectable`: Handling cursor movement and scrolling.
    *   `Window_StatusBase`: Provides specific helpers for actor stats.
*   **Customization:**
    *   Developers override methods like `drawItem(index)` or `refresh()`.
    *   Moving an element requires finding its `drawText` call and changing the `x` or `y` math.

### Pros & Cons
*   **[+] Precision:** Pixel-perfect control over every element.
*   **[-] rigidity:** "Flowing" layouts (e.g., text wrapping, automatic stacking) require complex manual math.
*   **[-] Coupling:** Layout logic (coordinates) is often hardcoded inside the rendering logic.

## 3. Current Engine Architecture
The current engine uses the **HTML DOM** for rendering but mimics the class structure of RMMZ.

### Characteristics
*   **Rendering:** HTML Elements (`<div>`, `<span>`) styled with CSS (Tailwind).
*   **Positioning:** **Imperative DOM Construction**. Windows build themselves by sequentially calling `document.createElement` and `appendChild`.
*   **Structure:**
    *   `Window_Base`: Wrapper around a root `<div>`.
    *   Classes like `Window_CreatureModal` manually build complex DOM trees in `createLayout`.
*   **Customization:**
    *   Requires editing the `createLayout` method.
    *   Reordering elements involves moving blocks of `createEl` and `appendChild` calls, which can be fragile ("DOM Spaghetti").

### Pros & Cons
*   **[+] Web Native:** Leverages CSS for advanced text styling, wrapping, and responsiveness easily.
*   **[-] Maintenance:** Large layout methods become difficult to read and modify.
*   **[-] Inconsistency:** No standard components; one window might make a bar using a `div`, another might use a `span`.

## 4. Proposed Architecture: Hybrid Composition
The goal is to provide the **Layout Flexibility** of the DOM (Flexbox/Grid) alongside the **Absolute Precision** of RMMZ. A developer should be able to choose whether to let elements flow naturally or pin them to specific coordinates.

### Core Concept
Windows are **Component Hosts**. Components can be added via **Flow** (relative) or **Coordinate** (absolute) strategies.

### The Hybrid Approach
We can support RMMZ-style precise layouts within the DOM by exposing `x`, `y`, `width`, and `height` properties on components, while still allowing nested components.

**RMMZ Style (Conceptual):**
```javascript
drawItem(index) {
    const rect = this.itemRect(index);
    this.drawText(this.items[index].name, rect.x, rect.y, 100);
}
```

**Proposed Hybrid Style:**
```javascript
createLayout() {
    // 1. Flow Layout (Web Style)
    // Good for lists, grids, and responsive content
    this.add(new HeaderComponent({ title: "Creature Stats" })); // Stacked at top

    // 2. Absolute Layout (RMMZ Style)
    // Good for precise HUDs, character sheets, and fixed designs
    const w = this.width;
    const h = this.height;

    // Explicitly place the sprite at x=0, y=50 with width=30%
    this.add(new SpriteComponent({ id: "actor_sprite" }), {
        x: 0,
        y: 50,
        width: w * 0.3,
        height: h - 50
    });

    // Explicitly place stats to the right
    this.add(new StatGridComponent({ fields: ["hp", "mp"] }), {
        x: w * 0.35,
        y: 50,
        width: w * 0.65
    });
}
```

### Why this fits the goal
This approach satisfies the request for "rigid precision" while keeping the system "intuitive and clean".

*   **Precision:** Use `x: 10, y: 20` to place pixels exactly where you want them.
*   **Clean Code:** No manual DOM creation strings. The logic is declarative ("Add a Sprite at X,Y") rather than imperative ("Create div, set style left, set style top, append").
*   **Modularity:** `StatGridComponent` is still a reusable block, regardless of whether it's placed via Flexbox or Absolute coordinates.

## 5. Reassessment of Plan
The original plan leaned too heavily on Flexbox/Grid. The revised plan adopts a **Hybrid Positioning System**.

**Revised Recommendation:**
1.  **Component System:** `UIComponent` is the base.
2.  **Positioning API:** `this.add(component, layoutOptions)`.
    *   If `layoutOptions` contains `x/y`, apply `position: absolute`.
    *   If not, default to `position: relative` (Flow).
3.  **Coordinate Helpers:** Add helpers like `lineHeight()`, `standardPadding()` to `Window_Base` to facilitate the math-based layout style RMMZ developers prefer.

This ensures we don't regress on the *feature* of precision, but we gain the *feature* of modularity.
