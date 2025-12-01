# Map and Event System Assessment

## Current Architecture

The game's current map and event handling is split between `Game_Map` (data), `ExploreSystem` (interaction/rendering), and `Systems.Events` (execution).

### 1. Map Data (`src/game/classes/Game_Map.js`)
*   **Grid-Based Integer Codes**: The map is represented as a 2D array of integers (`_data`).
*   **Hardcoded Values**: Specific integers correspond to specific entities:
    *   `1`: Wall
    *   `0`: Empty/Floor
    *   `2`: Enemy
    *   `3`: Stairs
    *   `4`: Treasure
    *   `5`: Shop
    *   `6`: Recruit
    *   `7`: Shrine
    *   `8`: Trap
*   **Generation**: `generateFloor()` creates a random layout and blindly places these codes based on configuration in `src/assets/data/dungeon.js`.

### 2. Interaction Logic (`src/game/systems/ExploreSystem.js`)
*   **Movement**: The `move(dx, dy)` method checks the tile at the target position.
*   **Resolution**: `resolveTile(code)` contains a hardcoded `if/else` block mapping codes to actions.
*   **State Reset**: Most events (except stairs) clear the tile (`setTile(x, y, 0)`) immediately upon triggering.
*   **Rendering**: `syncDynamic()` iterates the grid and spawns 3D meshes for non-wall/floor codes.

### 3. Event Execution (`src/game/systems.js` - `Systems.Events`)
*   **Direct UI Manipulation**: Methods like `shop()`, `recruit()` manually construct DOM elements (`document.createElement`) and inject them into the `#event-modal`.
*   **Logic Mixing**: Business logic (deducting gold, adding items) is intertwined with UI construction code.
*   **Limited Scope**: Events are functionally isolated functions with no shared state or sequencing capabilities.

## Limitations

1.  **Rigidity**: Adding a new event type requires changes in at least three different files (`Game_Map` generation, `ExploreSystem` resolution, `Systems.Events` execution).
2.  **Lack of State**: Events are stateless. A treasure chest is just a number `4`. It cannot remember *what* is inside it or if it has been opened (beyond being removed from the map).
3.  **No Scripting**: There is no way to chain events (e.g., "Battle -> Dialogue -> Reward") or have conditional events (e.g., "Door opens only if you have the Key").
4.  **UI Coupling**: The strong coupling between event logic and UI code makes it difficult to reskin the UI or automated testing.
5.  **Data Fragmentation**: Event data is split between code logic and `src/assets/data/events.js`.

## Refactor Plan

The goal is to move to a flexible, object-oriented Event System similar to RPG Maker, where the map holds "Event Objects" rather than just tile codes.

### Phase 1: Data Structure

1.  **Create `Game_Event` Class**:
    *   **Position**: `x`, `y`
    *   **Trigger**: `TOUCH`, `ACTION`, `AUTO`
    *   **Conditions**: e.g., `switch_1_on`, `item_has_key` (Future proofing)
    *   **Pages/Commands**: A list of commands to execute.
    *   **Visual**: Sprite/Mesh ID to render.

2.  **Update `Game_Map`**:
    *   Replace or augment the integer grid with a `Map<string, Game_Event>` (key: `"x,y"`) to store active events.
    *   Keep the integer grid for static terrain (walls/floors) but remove dynamic entities (enemies, shops, etc.) and place them as Events instead.

### Phase 2: Event Interpreter

1.  **Create `EventInterpreter` Class**:
    *   Takes a list of commands (e.g., `[{ code: 'MESSAGE', text: 'Hello' }, { code: 'GIVE_ITEM', id: 'potion' }]`).
    *   Executes them sequentially.
    *   Handles `await` for async actions (like battles or dialogues).

2.  **Decouple UI**:
    *   Events should emit signals or call Managers (e.g., `MessageManager.show()`, `ShopManager.open()`) rather than building DOM elements directly.

### Phase 3: Migration

1.  **Refactor `Game_Map.generateFloor`**:
    *   Instead of `map[y][x] = 5` (Shop), instantiate `new Game_Event({ type: 'SHOP', ... })` and add it to the map's event list.
2.  **Refactor `ExploreSystem`**:
    *   `syncDynamic`: Iterate through `Game_Map.events` to render meshes.
    *   `move/checkTile`: Check for events at the target location.
    *   If an event exists and trigger matches, pass its command list to the `EventInterpreter`.

### Phase 4: Implementation Details

*   **File Structure**:
    *   `src/game/classes/Game_Event.js`: The event entity.
    *   `src/game/systems/EventSystem.js`: The interpreter and manager (replacing `Systems.Events`).
    *   `src/assets/data/events.js`: JSON definitions for standard events (Chest, Shop, etc.).

## Example Event Data (JSON)

```json
{
  "id": "chest_01",
  "x": 10,
  "y": 15,
  "trigger": "TOUCH",
  "graphic": "chest_closed",
  "commands": [
    { "code": "PLAY_SE", "name": "chest_open" },
    { "code": "CHANGE_GRAPHIC", "name": "chest_open" },
    { "code": "MESSAGE", "text": "You found a Potion!" },
    { "code": "GIVE_ITEM", "id": "potion", "amount": 1 },
    { "code": "ERASE_EVENT" }
  ]
}
```
