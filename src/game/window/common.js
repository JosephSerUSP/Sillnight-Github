import { resolveAssetPath } from '../core.js';
import { Services } from '../ServiceLocator.js';

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
    const name = typeof unit?.name === 'function' ? unit.name() : unit?.name;
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
    const name = typeof unit.name === 'function' ? unit.name() : unit.name;
    const level = unit.level || 1;
    const hp = unit.hp;
    // Use Systems.Battle.getMaxHp for now as it handles bonuses, or unit.mhp if class
    let maxhp = 0;
    if (typeof unit.mhp === 'number') maxhp = unit.mhp; // Getter
    else if (typeof unit.mhp === 'function') maxhp = unit.mhp(); // Method
    else maxhp = 1; // Fallback

    const hpPct = (hp / maxhp) * 100;
    const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';

    // XP Progress
    // Use unit's calculation if available (Game_Actor), otherwise fallback
    let xpPct = 0;
    if (typeof unit.currentLevelExp === 'function' && typeof unit.nextLevelExp === 'function') {
        const currentLvlXp = unit.currentLevelExp();
        const nextLvlXp = unit.nextLevelExp();
        const currentExp = unit.currentExp ? unit.currentExp() : unit.exp || 0; // handle getter or prop

        // Avoid division by zero if max level or weird state
        if (nextLvlXp > currentLvlXp) {
             const xpInCurrentLvl = currentExp - currentLvlXp;
             const xpForThisLvl = nextLvlXp - currentLvlXp;
             xpPct = (xpInCurrentLvl / xpForThisLvl) * 100;
        } else {
            xpPct = 100; // Cap at max
        }
    } else {
        // Fallback for raw objects (e.g. from save data not rehydrated)
        // Try to calculate using the same logic if we have the data
        const lvl = unit.level || 1;
        const sId = unit.speciesId || unit._speciesId;
        const totalXp = unit.exp || unit._exp || 0;

        if (sId) {
            const def = Services.get('CreatureRegistry').get(sId);
            const curve = def ? (def.xpCurve || 10) : 10;
            const expForLevel = (l) => {
                if (l <= 1) return 0;
                return Math.floor(curve * 10 * Math.pow(l - 1, 1.5));
            };

            const currentLvlXp = expForLevel(lvl);
            const nextLvlXp = expForLevel(lvl + 1);

            if (nextLvlXp > currentLvlXp) {
                const xpInCurrentLvl = totalXp - currentLvlXp;
                const xpForThisLvl = nextLvlXp - currentLvlXp;
                xpPct = (xpInCurrentLvl / xpForThisLvl) * 100;
            } else {
                xpPct = 100;
            }
        } else {
            xpPct = 0;
        }
    }

    // Clamp percentage
    xpPct = Math.max(0, Math.min(100, xpPct));

    const maxMp = typeof unit.mmp === 'number' ? unit.mmp : (typeof unit.mmp === 'function' ? unit.mmp() : 0);
    const hasMp = maxMp > 0;
    const mpPct = hasMp ? (unit.mp / maxMp) * 100 : 0;

    return `
        <div class="flex justify-between text-gray-300">
            <span>${name}</span> <span class="text-[10px]">Lv${level}</span>
        </div>
        <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${spriteMarkup(unit, 'h-16 w-16 object-contain', '', 'text-2xl')}</div>
        <div class="mt-auto w-full space-y-0.5">
        <div class="text-[10px] text-right text-gray-500">${hp}/${maxhp}</div>
            <div class="w-full h-1 bg-gray-800"><div class="${hpColor} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
            ${hasMp ? `<div class="text-[10px] text-right text-gray-500">MP ${unit.mp}/${maxMp}</div>
            <div class="w-full h-1 bg-gray-800"><div class="bg-indigo-500 h-full" style="width:${mpPct}%"></div></div>` : ''}
            <div class="w-full h-1 bg-gray-800"><div class="bg-blue-500 h-full" style="width:${xpPct}%"></div></div>
        </div>
    `;
}
