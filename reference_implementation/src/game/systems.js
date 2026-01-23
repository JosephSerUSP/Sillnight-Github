import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';
import { ExploreSystem } from './systems/ExploreSystem.js';
import { BattleRenderSystem } from './systems/BattleRenderSystem.js';
import { EventSystem } from './systems/EventSystem.js';
import { BattleObserver } from './systems/BattleObserver.js';
import { EffekseerSystem } from './systems/EffekseerSystem.js';

// ------------------- SYSTEMS DEFINITIONS -------------------

/**
 * System for rendering the 3D battle scene.
 * @type {BattleRenderSystem}
 */
export const Battle3D = new BattleRenderSystem();

/**
 * System for handling the 3D exploration view and rendering.
 * @type {ExploreSystem}
 */
export const Explore = new ExploreSystem();

/**
 * System for global event management.
 * @type {EventSystem}
 */
export const Event = new EventSystem();

/**
 * System for handling passive triggers and traits.
 * @type {BattleObserver}
 */
export const Observer = new BattleObserver();

/**
 * The Effekseer particle system wrapper.
 * @type {EffekseerSystem}
 */
export const Effekseer = new EffekseerSystem();

/**
 * Hooks for triggering scene transitions.
 */
export const sceneHooks = { onBattleStart: null, onBattleEnd: null };
