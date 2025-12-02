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

## 4. Proposed Architecture: Hybrid Layout Managers
The goal is to provide the **Layout Flexibility** of the DOM (Flexbox/Grid) alongside the **Absolute Precision** of RMMZ. A developer should be able to choose whether to let elements flow naturally or pin them to specific coordinates using explicit **Layout Managers**.

### Core Concept
Windows use a **Blueprint** method (`defineLayout`) to return a tree of components. Each container in the tree has a **Layout Strategy** (Absolute, Flex, Grid).

### The Hybrid Approach
We support RMMZ-style precise layouts by using an `AbsoluteLayout` manager, while supporting lists and grids via `FlexLayout` or `GridLayout` managers.

**RMMZ Style (Conceptual):**
```javascript
drawItem(index) {
    const rect = this.itemRect(index);
    this.drawText(this.items[index].name, rect.x, rect.y, 100);
}
```

**Proposed Hybrid Style:**
```javascript
defineLayout() {
    const p = this.padding();

    return {
        // Root Container uses Absolute Layout (RMMZ Style)
        layout: new AbsoluteLayout(),
        children: [
            // 1. Precise Header (Pinned to specific coordinates)
            {
                component: HeaderComponent,
                props: { title: "Creature Stats" },
                constraints: { x: p, y: p, width: 400, height: 40 }
            },

            // 2. Flow Content (Web Style)
            // A Grid container placed at a specific absolute position
            {
                component: UIContainer,
                props: { layout: new GridLayout({ columns: 2 }) }, // Inner layout is Grid
                constraints: { x: p, y: 100, width: 400, height: 200 },
                children: [
                    { component: StatLabel, props: { param: 'hp' } },
                    { component: StatLabel, props: { param: 'mp' } }
                ]
            }
        ]
    };
}
```

### Why this fits the goal
This approach satisfies the request for "rigid precision" while keeping the system "intuitive and clean" and avoiding implicit magic.

*   **Explicit Intent:** Reading `layout: new AbsoluteLayout()` tells you exactly how the children behave.
*   **Clean Code:** The layout is defined as a structured data tree (Blueprint), making it easy to read, modify, and potentially externalize to JSON.
*   **Best of Both Worlds:** You get pixel-perfect `x, y` where you need it (HUDs), and automatic wrapping where you need it (Inventories).

## 5. Reassessment of Plan
The original plan relied on implicit behavior in `add()`. The revised plan adopts **Explicit Layout Managers** and **Declarative Blueprints**.

**Revised Recommendation:**
1.  **Layout Managers:** Implement `AbsoluteLayout`, `FlexLayout`, `GridLayout`.
2.  **Blueprint System:** `Window_Base` instantiates components from a `defineLayout()` method.
3.  **State Separation:** Windows handle Logic (ViewModel), Components handle Display (View).

This ensures we don't regress on the *feature* of precision, but we gain the *feature* of structured modularity.
