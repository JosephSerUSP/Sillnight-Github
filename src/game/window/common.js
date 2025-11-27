import { resolveAssetPath } from '../core.js';

export function spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
    const url = resolveAssetPath(unit?.spriteAsset);
    const name = typeof unit?.name === 'function' ? unit.name() : unit?.name;
    if (url) {
        return `<img src="${url}" alt="${name || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
    }
    return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${unit?.sprite || ''}</span>`;
}

export function renderCreaturePanel(unit) {
    if (!unit) return '';

    const maxhp = unit.mhp();
    const hpPct = (unit.hp / maxhp) * 100;
    const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';
    const xpPct = unit.getXpProgress();
    const name = typeof unit?.name === 'function' ? unit.name() : unit?.name;

    return `
        <div class="flex justify-between text-xs text-gray-300">
            <span>${name}</span> <span class="text-[10px]">Lv${unit.level}</span>
        </div>
        <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${spriteMarkup(unit, 'h-16 w-16 object-contain', '', 'text-3xl')}</div>
        <div class="mt-auto w-full space-y-0.5">
        <div class="text-[10px] text-right text-gray-500">${unit.hp}/${maxhp}</div>
            <div class="w-full h-1 bg-gray-800"><div class="${hpColor} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
            <div class="w-full h-1 bg-gray-800"><div class="bg-blue-500 h-full" style="width:${xpPct}%"></div></div>
        </div>
    `;
}
