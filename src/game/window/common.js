import { resolveAssetPath } from '../core.js';
import { Systems } from '../systems.js';

export function spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
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
    else maxhp = Systems.Battle.getMaxHp(unit); // Fallback

    const hpPct = (hp / maxhp) * 100;
    const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';

    // XP Progress
    // Reimplement simple logic here to avoid importing missing objects.js
    // Formula: Math.round(100 * Math.pow(level, 1.1)) is total XP for next level
    const getXpForNextLevel = (lvl) => Math.round(100 * Math.pow(lvl, 1.1));
    const currentLvlXp = level > 1 ? getXpForNextLevel(level - 1) : 0;
    const nextLvlXp = getXpForNextLevel(level);
    const xpInCurrentLvl = (unit.exp || 0) - currentLvlXp;
    const xpForThisLvl = nextLvlXp - currentLvlXp;
    const xpPct = (xpInCurrentLvl / xpForThisLvl) * 100;

    return `
        <div class="flex justify-between text-xs text-gray-300">
            <span>${name}</span> <span class="text-[10px]">Lv${level}</span>
        </div>
        <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${spriteMarkup(unit, 'h-16 w-16 object-contain', '', 'text-3xl')}</div>
        <div class="mt-auto w-full space-y-0.5">
        <div class="text-[10px] text-right text-gray-500">${hp}/${maxhp}</div>
            <div class="w-full h-1 bg-gray-800"><div class="${hpColor} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
            <div class="w-full h-1 bg-gray-800"><div class="bg-blue-500 h-full" style="width:${xpPct}%"></div></div>
        </div>
    `;
}
