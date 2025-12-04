import { resolveAssetPath } from '../core.js';
// Systems import removed

/**
 * Generates the HTML markup for a unit's sprite.
 * Handles both Game_Battler instances and raw data objects.
 * @param {Object} unit - The unit to render.
 * @param {string} [sizeClasses='h-10 w-10 object-contain'] - CSS classes for sizing.
 * @param {string} [extraClasses=''] - Additional CSS classes.
 * @param {string} [textClass='text-2xl'] - CSS class for text fallback.
 * @returns {string} The HTML string.
 */
export function spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-xl') {
    // Handle both class instance and raw object
    const name = typeof unit?.name === 'function' ? unit.name() : unit?.name; // Method Call if function
    const sprite = typeof unit?.sprite === 'function' ? unit.sprite() : unit?.sprite;
    const spriteAsset = typeof unit?.spriteAsset === 'function' ? unit.spriteAsset() : unit?.spriteAsset;

    const url = resolveAssetPath(spriteAsset);
    if (url) {
        return `<img src="${url}" alt="${name || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
    }
    return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${sprite || ''}</span>`;
}

/**
 * Renders the status panel for a creature.
 * Includes name, level, sprite, HP bar, and XP bar.
 * @param {Object} unit - The unit to render.
 * @returns {string} The HTML string.
 */
export function renderCreaturePanel(unit) {
    if (!unit) return '';

    // Handle class vs raw object
    // If it's a class instance with a name getter, accessing .name calls the getter.
    // If it's a raw object, .name is a property.
    // If it's a class instance with a name() method (not getter), we need to call it.
    // However, Game_Battler defines `get name()`. So unit.name works for both.
    // The previous code `typeof unit.name === 'function'` was checking if the property itself is a function.
    // For a getter, `unit.name` returns the value, so it's a string.
    // For a method, `unit.name` is a function.

    let name = unit.name;
    if (typeof unit.name === 'function') {
        name = unit.name();
    }

    const level = unit.level || 1;
    const hp = unit.hp;
    // Use unit.mhp if class or property
    let maxhp = 0;
    if (typeof unit.mhp === 'number') maxhp = unit.mhp; // Getter/Prop
    else if (typeof unit.mhp === 'function') maxhp = unit.mhp(); // Method
    else maxhp = 1; // Fallback

    const hpPct = (hp / maxhp) * 100;
    const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';

    // XP Progress
    const getXpForNextLevel = (lvl) => Math.round(100 * Math.pow(lvl, 1.1));
    const currentLvlXp = level > 1 ? getXpForNextLevel(level - 1) : 0;
    const nextLvlXp = getXpForNextLevel(level);
    const xpInCurrentLvl = (unit.exp || 0) - currentLvlXp;
    const xpForThisLvl = nextLvlXp - currentLvlXp;
    const xpPct = (xpInCurrentLvl / xpForThisLvl) * 100;

    return `
        <div class="flex justify-between text-gray-300">
            <span>${name}</span> <span class="text-[10px]">Lv${level}</span>
        </div>
        <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${spriteMarkup(unit, 'h-16 w-16 object-contain', '', 'text-2xl')}</div>
        <div class="mt-auto w-full space-y-0.5">
        <div class="text-[10px] text-right text-gray-500">${hp}/${maxhp}</div>
            <div class="w-full h-1 bg-gray-800"><div class="${hpColor} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
            <div class="w-full h-1 bg-gray-800"><div class="bg-blue-500 h-full" style="width:${xpPct}%"></div></div>
        </div>
    `;
}
