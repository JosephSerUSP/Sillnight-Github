# Window System Assessment and Refactoring Plan

## 1. Executive Summary
The current window system in the engine follows a traditional inheritance model (`Window_Base` -> `Window_Selectable` -> Implementation). While functional, it suffers from rigid, imperative DOM construction, hardcoded styling, and monolithic class designs. This makes customization, iteration, and maintenance difficult.

This document outlines a plan to transition to a **Declarative, Component-Based Architecture**. The goal is to separate *layout definition* from *logic*, enabling windows to be constructed via configuration objects and composed of reusable widgets.

## 2. Current Architecture Assessment

### 2.1. Hierarchy
*   **`Window_Base`**: Handles root DOM element creation, visibility (`hidden` class), and basic font sizing. It provides imperative helper methods like `createEl`.
*   **`Window_Selectable`**: Extends `Window_Base` to add list management logic (`items`, `index`) and an abstract `drawItem` method.
*   **Concrete Implementations**: (e.g., `Window_CreatureModal`, `Window_HUD`) extend these bases.

### 2.2. Identified Issues
1.  **Imperative "Spaghetti" Layouts**: Windows build their UI by calling `createEl` dozens of times in a specific sequence. Changing the visual order requires moving lines of code, making it fragile.
    *   *Example*: `Window_CreatureModal.createLayout` manually appends header, left column, right column, stats grid, etc., in a fixed chain.
2.  **Tight Coupling of Style and Logic**: Tailwind classes are hardcoded as string literals within the logic. Changing the look of a "Stat Box" requires finding every instance of that string in the code.
3.  **Monolithic Classes**: `Window_CreatureModal` contains logic for displaying stats, managing equipment, rendering skills, and handling events. This violates the Single Responsibility Principle.
4.  **Manual Data Binding**: `refresh()` methods manually select DOM elements and update `innerText`. This is error-prone; if a DOM ID changes, the code breaks.
5.  **Lack of Reusability**: Components like "HP Bar" or "Item Slot" are often re-implemented or rely on global helper functions (`renderCreaturePanel`) rather than being self-contained objects.

## 3. Refactoring Goals
1.  **Declarative Composition**: Define a window's layout using a nested configuration object (JSON-like), not code execution.
2.  **Modularity**: Break complex windows into small, testable `UIComponent` classes (e.g., `StatBar`, `ItemGrid`, `SpriteView`).
3.  **Code-Driven Customization**: Allow developers to inject or modify the layout configuration before the window is built, enabling easy "modding" or UI adjustments.
4.  **Separation of Concerns**: Logic handles *data*, Layout handles *positioning*, Components handle *rendering*.

## 4. Proposed Architecture

### 4.1. The New `Window_Base`
`Window_Base` will evolve to become a **Layout Host**. Instead of manually creating children, it will take a `layoutDefinition` and use a `LayoutBuilder` to construct the DOM.

```javascript
class Window_Base {
    constructor(rectOrId, layoutDef) {
        this.root = this.resolveRoot(rectOrId);
        this.components = {}; // Registry of active components by ID
        if (layoutDef) {
            this.buildLayout(layoutDef);
        }
    }

    buildLayout(def) {
        // Recursively build DOM based on 'def'
        // Instantiate components and store them in this.components
    }

    refresh() {
        // Propagate refresh to all child components
        Object.values(this.components).forEach(c => c.refresh(this.getData()));
    }
}
```

### 4.2. UI Components
A new base class `UIComponent` will serve as the building block.

```javascript
class UIComponent {
    constructor(config) {
        this.element = document.createElement('div');
        this.config = config;
    }

    // Updates the visual state based on provided data
    refresh(data) { ... }
}
```

### 4.3. Declarative Layout Schema
Layouts will be defined as nested objects. This allows them to be easily modified, saved, or loaded.

```javascript
const CreatureModalLayout = {
    type: 'container',
    style: 'modal-window',
    layout: 'flex-row',
    children: [
        {
            type: 'container',
            width: '40%',
            children: [
                { type: 'creature-sprite', id: 'sprite_view' },
                { type: 'text', id: 'name_label', style: 'header-text' }
            ]
        },
        {
            type: 'container',
            width: '60%',
            children: [
                { type: 'stats-grid', id: 'main_stats' },
                { type: 'tab-panel', id: 'details_tabs', tabs: ['Skills', 'Equip'] }
            ]
        }
    ]
};
```

## 5. Refactoring Plan

### Phase 1: Core Foundation
1.  **Create `src/game/ui/UIComponent.js`**: Define the base class for all widgets.
2.  **Create `src/game/ui/LayoutBuilder.js`**: Implement a utility that parses the Layout Schema and constructs DOM elements, returning a map of created components.
3.  **Update `Window_Base`**: Add the `buildLayout` method utilizing the builder. Ensure backward compatibility for windows that still use imperative `initialize`.

### Phase 2: Component Library
Extract common UI patterns from `Window_CreatureModal` and `Window_HUD` into reusable components:
*   `Label`: Simple text with style presets.
*   `Icon`: Sprite or image rendering.
*   `Gauge`: Progress bars (HP/MP/XP).
*   `Grid`: A container that arranges children in a grid.
*   `List`: A specialized container for repeating items (replacing `Window_Selectable` logic eventually).

### Phase 3: Migration (Pilot)
Target **`Window_CreatureModal`** for the first full migration.
1.  Define `CreatureModalLayout` constant.
2.  Rewrite `Window_CreatureModal` to pass this layout to `super()`.
3.  Remove `createLayout`, `createLeftColumn`, `createRightColumn` methods.
4.  Update `refresh()` to simply pass the `unit` data to `this.components.sprite_view.refresh(unit)`, `this.components.main_stats.refresh(unit)`, etc.

### Phase 4: Expansion & Standardization
1.  Migrate `Window_Inventory` and `Window_PartyMenu`.
2.  Refactor `Window_Selectable` to be a wrapper around a `ListComponent`.
3.  Centralize styling: Move hardcoded Tailwind strings into a `Theme` or `StyleMap` object (e.g., `Styles.Window.Background`), allowing for global restyling.

## 6. Benefits
*   **Customizability**: Moving elements is as simple as rearranging the JSON object.
*   **Maintainability**: Fixing a bug in the "HP Bar" fixes it everywhere that component is used.
*   **Readability**: The structure of a window is immediately visible in the layout definition, rather than buried in function calls.
