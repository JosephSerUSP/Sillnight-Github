# Window System Assessment and Refactoring Plan

## 1. Executive Summary
The current window system follows a DOM-based inheritance model (`Window_Base` -> `Window_Selectable`). While accessible, it suffers from imperative "spaghetti code" logic for layout construction, making it brittle and difficult to customize.

This document proposes a **Hybrid Compositional Architecture** using **Layout Managers**. This approach bridges the gap between the precise, coordinate-based nature of RPG Maker MZ and the flexible, component-based nature of modern web development. It introduces a clear separation between *Content* (Components), *Positioning* (Layout Managers), and *Logic* (Window Controllers).

## 2. Current Architecture Assessment

### 2.1. Issues with the Current System
*   **Imperative Layouts**: `Window_CreatureModal` builds its UI by calling `createEl` sequentially.
*   **Implicit Positioning**: Layout behavior is hidden in `createLayout` logic.
*   **Tight Coupling**: Styling, Layout, and Logic are mixed in monolithic classes.

### 2.2. Comparison with RPG Maker MZ
*   **RMMZ**: Uses absolute coordinates (`x, y`) on a Canvas. Precise but rigid.
*   **Current**: Uses DOM `appendChild`. Flexible styling but chaotic structure.
*   **Goal**: We want the **Precision** of RMMZ combined with the **Modularity** of a component system, managed by explicit **Layout Strategies**.

## 3. Proposed Architecture: Layout Managers & Blueprints

We propose a structured architecture consisting of three layers:
1.  **Window (Host)**: Manages lifecycle, input, and binds game state to components.
2.  **Layout Managers**: Explicitly handle positioning logic (Absolute, Flex, Grid).
3.  **Components**: Dumb, reusable visual units (Label, Icon, Gauge) that accept props.

### 3.1. Layout Managers
Instead of mixing layout logic into `add()`, we use dedicated managers.

```javascript
// Strategies for positioning children
class AbsoluteLayout {
    apply(child, constraints) {
        child.element.style.position = 'absolute';
        if (constraints.x != null) child.element.style.left = `${constraints.x}px`;
        if (constraints.y != null) child.element.style.top = `${constraints.y}px`;
        if (constraints.width) child.element.style.width = `${constraints.width}px`;
        if (constraints.height) child.element.style.height = `${constraints.height}px`;
    }
}

class FlexColumnLayout {
    constructor(gap = 0) { this.gap = gap; }
    apply(container) {
        container.element.style.display = 'flex';
        container.element.style.flexDirection = 'column';
        container.element.style.gap = `${this.gap}px`;
    }
}
```

### 3.2. The New `Window_Base` & `UIContainer`
Windows host a root `UIContainer`. Containers delegate positioning to their assigned Layout Manager.

```javascript
class UIContainer extends UIComponent {
    constructor({ layout }) {
        super();
        this.layout = layout || new AbsoluteLayout(); // Default to RMMZ style
        this.children = [];
    }

    add(child, constraints = {}) {
        this.children.push(child);
        this.element.appendChild(child.element);
        // If layout supports per-child constraints (like Absolute), apply them
        if (this.layout.applyChild) this.layout.applyChild(child, constraints);
        return child;
    }

    refresh(data) {
        this.children.forEach(c => c.refresh(data));
    }
}

class Window_Base {
    constructor(rect) {
        this.root = this.resolveRoot(rect);
        // Root container is Absolute by default to match RMMZ window behavior
        this.container = new UIContainer({ layout: new AbsoluteLayout() });
        this.root.appendChild(this.container.element);

        // Build the tree
        const tree = this.defineLayout();
        if (tree) this.instantiateLayout(tree, this.container);
    }

    // Declarative Blueprint
    defineLayout() { return null; }

    // Recursively builds components from the blueprint
    instantiateLayout(node, parent) { ... }
}
```

### 3.3. Example Implementation: `Window_CreatureModal`

Developers define a **Layout Tree**. This blueprint describes *what* to create and *where* to put it, without imperative DOM building.

```javascript
class Window_CreatureModal extends Window_Base {
    defineLayout() {
        const p = this.padding();
        const lh = this.lineHeight();

        return {
            type: 'container', // The Root
            layout: new AbsoluteLayout(),
            children: [
                // 1. Precise Header (Absolute)
                {
                    id: 'sprite',
                    component: SpriteView,
                    props: { id: 'actor_sprite' },
                    constraints: { x: p, y: p, width: 200, height: 200 }
                },
                {
                    id: 'name',
                    component: Label,
                    props: { style: 'header' },
                    constraints: { x: p + 200 + p, y: p, width: 400 }
                },

                // 2. Flow Content (Grid) nested inside Absolute
                {
                    id: 'stats_area',
                    component: UIContainer,
                    props: { layout: new GridLayout({ columns: 2, gap: 10 }) },
                    constraints: {
                        x: p + 200 + p,
                        y: p + lh * 2,
                        width: 400,
                        height: 200
                    },
                    children: [
                        { component: StatLabel, props: { param: 'hp' } },
                        { component: StatLabel, props: { param: 'mp' } },
                        { component: StatLabel, props: { param: 'atk' } }
                    ]
                }
            ]
        };
    }

    refresh() {
        // Window acts as Controller: binds State -> View
        const actor = this.actor;
        this.getComponent('stats_area').children.forEach(c => {
            // Components are "dumb", logic is here
            c.setValue(actor[c.param], actor.mhp);
        });
    }
}
```

## 4. Refactoring Plan

### Phase 1: Core Framework
1.  **Create `UIComponent` & `UIContainer`**: Base classes.
2.  **Create Layout Managers**: `AbsoluteLayout`, `FlexLayout`, `GridLayout`.
3.  **Update `Window_Base`**: Implement `defineLayout()` interface and `instantiateLayout()` builder logic.

### Phase 2: Component Library
Extract "Dumb Views" from existing code:
*   `Label` (Text wrapper)
*   `SpriteView` (Image wrapper)
*   `Gauge` (Visual bar only, no logic)

### Phase 3: Pilot Migration (Window_CreatureModal)
Refactor `Window_CreatureModal` using the Blueprint approach.
*   Define the layout tree returning mixed Absolute and Grid layouts.
*   Move state binding logic (reading `$gameParty`) into `refresh()`, keeping components pure.

### Phase 4: Standardization
*   Refactor `Window_HUD` to use `AbsoluteLayout`.
*   Refactor `Window_Inventory` to use `FlexLayout` (lists).
*   Create a **Theme System** so Components use semantic class names (`theme-text-header`) instead of raw Tailwind (`text-xl font-bold`).

## 5. Benefits
*   **Structured Precision**: Explicit Layout Managers make it clear *how* a container behaves (Flow vs Fixed).
*   **Declarative Blueprints**: Layouts are data structures, paving the way for future JSON-based modding or visual editors.
*   **Separation of Concerns**: Components don't know about Game State; Windows act as the glue.
