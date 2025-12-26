const { Window_Shop } = await import('../src/game/window/shop.js');
// Mock dependencies
window.Window_Selectable = class { initialize(){} show(){} hide(){} };
window.Services = { get: () => ({ get: () => ({}) }) };
window.FlexLayout = class { constructor(el) { el.style.display='flex'; } };
window.TextComponent = class {};
window.ButtonComponent = class {};
// ... This is too complex to mock quickly.
