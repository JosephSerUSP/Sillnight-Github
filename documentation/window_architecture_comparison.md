# Window Architecture Comparison & Refactoring Strategy

## 1. Introduction
This document compares the window architecture of **RPG Maker MZ (RMMZ)**, the **Current Engine Implementation**, and the **Proposed Refactoring**. The goal is to identify the best approach for a modular, customizable, and code-driven window system that leverages the current engine's web technologies while providing an intuitive developer experience similar to RMMZ.

## 2. RPG Maker MZ Architecture (The Reference)
RMMZ uses a **Canvas/WebGL** rendering pipeline (via PIXI.js). Windows are containers that draw text and sprites onto a bitmap.

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

## 4. Proposed Architecture: Compositional Component System
Instead of copying RMMZ's *implementation* (absolute coordinates) or the Current Engine's *imperative nesting*, we propose a **Compositional Approach**. This aligns with modern UI development (React, Vue) but maintains an Object-Oriented "Code-Driven" feel familiar to RMMZ developers.

### Core Concept
Windows are no longer "painters" (RMMZ) or "builders" (Current). They are **Hosts** for **Components**.

### The Difference
**RMMZ Style (Conceptual):**
```javascript
drawItem(index) {
    const rect = this.itemRect(index);
    this.drawText(this.items[index].name, rect.x, rect.y, 100);
    this.drawIcon(1, rect.x + 100, rect.y);
}
```

**Proposed Compositional Style:**
```javascript
createLayout() {
    // Define the structure logically, not by pixels
    this.add(new HeaderComponent({ title: "Creature Stats" }));

    const columns = this.add(new ColumnLayout({ splits: [1, 2] }));

    columns.left.add(new SpriteComponent({ id: "actor_sprite" }));
    columns.right.add(new StatGridComponent({ fields: ["hp", "mp", "atk"] }));
}
```

### Why this fits the goal
The user requested a system where they can *"easily find the window in code and finetune it, repositioning, adding and removing elements, in a way that's intuitive and clean."*

*   **Repositioning:** Swap the order of `this.add()` calls.
*   **Adding/Removing:** Add or remove a single line of code.
*   **Precision:** Components can accept CSS style overrides or configuration objects for fine-tuning.
*   **Modularity:** A `StatBar` component is defined once and reused everywhere.

## 5. Reassessment of Plan
The original plan proposed a strictly **Declarative JSON Schema** (e.g., `const layout = { type: 'row', ... }`). While powerful, this might feel too detached for a developer used to RMMZ's *coding* paradigm.

**Revised Recommendation:**
Adopt a **Code-First Composition** approach.
1.  **Keep the Class Structure:** `Window_CreatureModal` still exists.
2.  **Abstract the DOM:** The developer shouldn't manually `createElement`. They should instantiate `Components`.
3.  **Layout System:** Use simple layout components (`Row`, `Column`, `Grid`) to handle positioning, leveraging CSS Flexbox/Grid under the hood.

This hybrid approach offers the **power of the DOM** (automatic layout, styling) with the **familiarity of RMMZ** (OOP class structures, distinct "draw/create" phases), satisfying the prompt's request for modularity and ease of customization.
