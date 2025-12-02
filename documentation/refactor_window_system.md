# Window System Assessment and Refactoring Plan

## 1. Executive Summary
The current window system follows a DOM-based inheritance model (`Window_Base` -> `Window_Selectable`). While accessible, it suffers from imperative "spaghetti code" logic for layout construction, making it brittle and difficult to customize.

This document proposes a **Hybrid Compositional Architecture**. This approach bridges the gap between the familiar, precise "Code-Driven" nature of RPG Maker MZ and the flexible, modern nature of web development. It allows developers to build windows by composing logical units (Components) using **either** automatic flow layouts (Flexbox) **or** precise coordinate positioning (Absolute).

## 2. Current Architecture Assessment

### 2.1. Issues with the Current System
*   **Imperative Layouts**: `Window_CreatureModal` builds its UI by calling `createEl` sequentially.
*   **Tight Coupling**: Styling and Logic are mixed.
*   **Lack of Reusability**: Common elements are re-implemented in each window.

### 2.2. Comparison with RPG Maker MZ
*   **RMMZ**: Uses absolute coordinates (`x, y`) on a Canvas. Precise but rigid.
*   **Current**: Uses DOM `appendChild`. Flexible styling but chaotic structure.
*   **Goal**: We want the **Precision** of RMMZ (e.g., "place this at x=100") combined with the **Modularity** of a component system, accessible via a **Clean API**.

## 3. Proposed Architecture: Hybrid Composition

We propose a **Builder/Composition API** where `Window_Base` acts as a host for `UIComponent` objects. Critically, these components can be positioned using explicit coordinates (RMMZ style) or automatic flow (Web style).

### 3.1. The New `Window_Base`

```javascript
class Window_Base {
    constructor(rectOrId) {
        this.root = this.resolveRoot(rectOrId);
        this.components = [];
        this.createLayout(); // Abstract method called on init
    }

    /**
     * Adds a component to the window.
     * @param {UIComponent} component - The component to add.
     * @param {Object} [options] - Positioning options.
     * @param {number} [options.x] - Absolute X position.
     * @param {number} [options.y] - Absolute Y position.
     * @param {number} [options.width] - Fixed width.
     * @param {number} [options.height] - Fixed height.
     */
    add(component, options = {}) {
        if (options.x !== undefined || options.y !== undefined) {
             // Apply Absolute Positioning
             component.element.style.position = 'absolute';
             if (options.x !== undefined) component.element.style.left = `${options.x}px`;
             if (options.y !== undefined) component.element.style.top = `${options.y}px`;
             if (options.width) component.element.style.width = `${options.width}px`;
             if (options.height) component.element.style.height = `${options.height}px`;
        }

        this.root.appendChild(component.element);
        this.components.push(component);
        return component;
    }

    // Helper for RMMZ-style math
    lineHeight() { return 36; }
    padding() { return 18; }
}
```

### 3.2. Example Implementation: `Window_CreatureModal`

This example demonstrates the hybrid approach: using precise math for layout while keeping the code clean and component-based.

```javascript
class Window_CreatureModal extends Window_Base {
    createLayout() {
        const p = this.padding();
        const lh = this.lineHeight();
        const w = this.width;

        // --- 1. Precise Positioning (RMMZ Style) ---

        // Sprite: Top-Left, fixed size
        this.add(new SpriteView({ id: 'actor_sprite' }), {
            x: p,
            y: p,
            width: 200,
            height: 200
        });

        // Name: To the right of the sprite
        this.add(new Label({ id: 'actor_name', style: 'header' }), {
            x: p + 200 + p,
            y: p,
            width: w - (p + 200 + p)
        });

        // --- 2. Flow Content (Web Style) ---

        // We can also create a container that uses flow layout internally,
        // but place that container at a specific coordinate.
        const statsArea = new Container({ layout: 'grid', columns: 2 });
        this.add(statsArea, {
            x: p + 200 + p,
            y: p + lh * 2,
            width: w - (p + 200 + p),
            height: 200
        });

        // Add items to the flow container - they arrange themselves automatically
        statsArea.add(new StatLabel({ param: 'hp' }));
        statsArea.add(new StatLabel({ param: 'mp' }));
        statsArea.add(new StatLabel({ param: 'atk' }));
    }
}
```

## 4. Refactoring Plan

### Phase 1: Core Framework
1.  **Create `src/game/ui/UIComponent.js`**: The base class. Handles the root DOM element creation and basic lifecycle (`refresh`, `show`, `hide`).
2.  **Update `Window_Base`**: Add the `add(component, options)` method that supports both `appendChild` (flow) and `style.left/top` (absolute).
3.  **Implement Helpers**: Add `lineHeight()`, `standardPadding()`, `itemRect(index)` to `Window_Base` to support calculation-based layouts.

### Phase 2: Component Library
Extract logic from existing windows into reusable components:
*   `Label`: Text with style presets.
*   `Icon`: Image/Sprite rendering.
*   `Gauge`: Progress bars (HP/MP/XP).
*   `Container`: A component that can hold other components (supporting nested flow layouts).

### Phase 3: Pilot Migration (Window_CreatureModal)
Refactor `Window_CreatureModal` to use the new system.
*   Demonstrate the use of `x, y` coordinates to position the sprite and main sections (mimicking the "rigid" structure).
*   Use internal flow containers for lists (like the equipment list) where pixel-perfect precision is tedious and automatic flowing is superior.

### Phase 4: Standardization
*   Migrate `Window_HUD` and `Window_Inventory`.
*   Establish a **Theme System**: A central configuration file (e.g., `src/game/ui/theme.js`) that maps logical styles (`header`, `body`, `warning`) to CSS classes.

## 5. Benefits
*   **Precision**: Developers can use `x`, `y`, and math constants to create pixel-perfect interfaces, just like in RMMZ.
*   **Cleanliness**: No "DOM Spaghetti". The layout is defined by a list of logical `add()` calls.
*   **Flexibility**: You aren't forced to calculate every pixel if you don't want to. You can drop a `GridContainer` into a precise coordinate and let it handle its children automatically.
