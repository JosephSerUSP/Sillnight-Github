# Window System Refactoring: Hybrid Compositional Architecture

## Overview
This plan outlines the transition of the window system from a simple inheritance-based model to a **Hybrid Compositional Architecture**. This addresses the limitations of the current `Window_Base` implementation, which tightly couples layout logic with window rendering and struggles with complex, responsive layouts.

The new architecture decouples **Layout** (positioning) from **Components** (content) and **Windows** (controllers).

## Goals
1.  **Decouple Layout:** Move positioning logic out of `Window_Base` and into dedicated `LayoutManager` classes.
2.  **Composition:** Allow windows to be composed of multiple sub-components (Headers, Lists, Grids).
3.  **Flexibility:** Support absolute, flex, and grid layouts dynamically.
4.  **Maintainability:** Simplify `Window_` subclasses by removing ad-hoc DOM manipulation.

## Architecture

### 1. Window (Controller)
*   **Role:** The "Brain". Manages state, handles input, and defines the high-level blueprint.
*   **Responsibility:**
    *   Initialize the `LayoutManager`.
    *   Define the layout structure (via `defineLayout()`).
    *   Update content when state changes (`refresh()`).

### 2. LayoutManager (The Engine)
*   **Role:** The "Builder". Interprets the blueprint and manages DOM nodes.
*   **Types:**
    *   `AbsoluteLayout`: Direct x,y,w,h positioning (Legacy/PS1 style).
    *   `FlexLayout`: CSS Flexbox wrapper.
    *   `GridLayout`: CSS Grid wrapper.
*   **Responsibility:**
    *   Create and manage container DOM elements.
    *   Add/Remove child components.
    *   Apply styles based on layout type.

### 3. Components (The View)
*   **Role:** "Dumb" views. Render specific content.
*   **Examples:** `TextComponent`, `IconComponent`, `ListComponent`, `GridComponent`.
*   **Responsibility:**
    *   Render HTML/Text.
    *   Handle local events (e.g., hover).

## Phases

### Phase I: Core Architecture & Layout System
**Goal:** Establish the base classes and migrate `Window_Base` to use the new system.
1.  **Create `src/game/layout/` directory.**
2.  **Implement `LayoutManager` (Base), `AbsoluteLayout`, `FlexLayout`, and `GridLayout`.**
3.  **Update `Window_Base`** to integrate with `LayoutManager`.
    *   Add `this.layout` property.
    *   Add `defineLayout()` method stub.
4.  **Create `Component` base class.**
5.  **Verification:** Ensure existing windows (which inherit from `Window_Base`) still function (backward compatibility mode).

### Phase II: Component Library & Migration
**Goal:** Build standard components and migrate a complex window.
1.  **Implement Standard Components:**
    *   `TextComponent`
    *   `ButtonComponent`
    *   `WindowFrameComponent` (The standard blue background/border)
2.  **Migrate `Window_HUD`:** Refactor `Window_HUD` to use `FlexLayout` and components.
3.  **Migrate `Window_Party`:** Refactor `Window_Party` to use `GridLayout`.

### Phase III: Advanced Features & Full Adoption
**Goal:** Complete migration and add dynamic features.
1.  **Migrate `Window_CreatureModal`:** This is the most complex window. Refactor to use nested layouts.
2.  **Implement Dynamic Layouts:** Allow switching layouts at runtime (e.g., mobile view).
3.  **Cleanup:** Remove legacy DOM methods from `Window_Base` once all subclasses are migrated.

## Current Stage
*   **Phase I:** Complete
*   **Phase II:** Complete
*   **Phase III:** Pending
