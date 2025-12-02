# Window System Assessment and Refactoring Plan

## 1. Executive Summary
The current window system follows a DOM-based inheritance model (`Window_Base` -> `Window_Selectable`). While accessible, it suffers from imperative "spaghetti code" logic for layout construction, making it brittle and difficult to customize.

This document proposes a **Compositional Component Architecture**. This approach bridges the gap between the familiar "Code-Driven" nature of RPG Maker MZ and the modern "Component-Based" nature of web development (React/Vue). It allows developers to build windows by composing logical units (Components) rather than manually manipulating DOM elements or pixel coordinates.

## 2. Current Architecture Assessment

### 2.1. Issues with the Current System
*   **Imperative Layouts**: `Window_CreatureModal` builds its UI by calling `createEl` sequentially. Changing the visual order requires moving blocks of code, which is error-prone.
*   **Tight Coupling**: Styling (Tailwind classes) and Logic are mixed.
*   **Lack of Reusability**: Common elements (HP bars, Item slots) are often re-implemented in each window.

### 2.2. Comparison with RPG Maker MZ
*   **RMMZ**: Uses absolute coordinates (`x, y`) on a Canvas. Precise but rigid.
*   **Current**: Uses DOM `appendChild`. Flexible styling but chaotic structure.
*   **Goal**: We want the **Layout Flexibility** of the DOM (Flexbox/Grid) with the **Modular Structure** of a component system, accessible via a **Clean API** familiar to game developers.

## 3. Proposed Architecture: Code-First Composition

Instead of a purely static JSON schema (which can feel alien to RMMZ developers), we propose a **Builder/Composition API**. Windows define their layout by instantiating and adding `UIComponent` objects.

### 3.1. The New `Window_Base`
`Window_Base` will act as a **Component Host**.

```javascript
class Window_Base {
    constructor(rectOrId) {
        this.root = this.resolveRoot(rectOrId);
        this.components = [];
        this.createLayout(); // Abstract method called on init
    }

    /**
     * Adds a component to the window.
     * @param {UIComponent} component
     * @param {string} [slot] - Optional ID of a container to add to.
     */
    add(component, slot = null) {
        const parent = slot ? this.findComponent(slot) : this.root;
        parent.appendChild(component.element);
        this.components.push(component);
        return component;
    }

    refresh() {
        // Propagate data to all components
        const data = this.getData();
        this.components.forEach(c => c.refresh(data));
    }
}
```

### 3.2. Example Implementation: `Window_CreatureModal`

```javascript
class Window_CreatureModal extends Window_Base {
    createLayout() {
        // 1. Create Structure (Layout Components)
        const mainRow = this.add(new RowLayout({ gap: 4 }));
        const leftCol = mainRow.add(new ColumnLayout({ width: '40%' }));
        const rightCol = mainRow.add(new ColumnLayout({ width: '60%' }));

        // 2. Add Content (Functional Components)
        leftCol.add(new SpriteView({ id: 'actor_sprite', height: 200 }));
        leftCol.add(new Label({ id: 'actor_name', style: 'header' }));

        rightCol.add(new StatGrid({ fields: ['hp', 'mp', 'atk', 'def'] }));
        rightCol.add(new TabPanel({
            tabs: [
                { title: 'Skills', content: new SkillList() },
                { title: 'Equip', content: new EquipmentSlotList() }
            ]
        }));
    }
}
```

## 4. Refactoring Plan

### Phase 1: Core Framework
1.  **Create `src/game/ui/UIComponent.js`**: The base class. Handles the root DOM element creation and basic lifecycle (`refresh`, `show`, `hide`).
2.  **Create Layout Components**: Implement `RowLayout`, `ColumnLayout`, and `GridLayout` components that wrap Flexbox/Grid CSS logic.
3.  **Update `Window_Base`**: Add the `add()` method and component registry logic.

### Phase 2: Component Library
Extract logic from existing windows into reusable components:
*   `Label`: Text with style presets.
*   `Icon`: Image/Sprite rendering.
*   `ProgressBar`: For HP/XP bars.
*   `Card`: A styled container for items/skills.

### Phase 3: Pilot Migration (Window_CreatureModal)
Refactor `Window_CreatureModal` to use the new system.
*   Replace the imperative `createLeftColumn` / `createRightColumn` methods with the Composition API example above.
*   Verify that `refresh()` correctly propagates the `unit` object to child components.

### Phase 4: Standardization
*   Migrate `Window_HUD` and `Window_Inventory`.
*   Establish a **Theme System**: A central configuration file (e.g., `src/game/ui/theme.js`) that maps logical styles (`header`, `body`, `warning`) to CSS classes. Components will reference these keys instead of hardcoded strings.

## 5. Benefits
*   **Intuitive Customization**: Developers can "read" the layout structure in `createLayout` and easily reorder lines to swap UI elements.
*   **Web-Native Power**: Uses CSS Flexbox/Grid for automatic sizing (no manual x/y math needed).
*   **Modularity**: Fix a bug in `ProgressBar` once, and it's fixed in the HUD, Battle UI, and Menu.
