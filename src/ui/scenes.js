class SceneBase {
    constructor(manager, windows = []) {
        this.manager = manager;
        this.windows = windows;
    }

    enter() {
        this.windows.forEach(w => w.show && w.show());
    }

    exit() {
        this.windows.forEach(w => w.hide && w.hide());
    }
}

export class SceneExplore extends SceneBase {
    constructor(manager) {
        super(manager, [manager.hudWindow, manager.logWindow, manager.controlsWindow, manager.partyWindow]);
    }

    enter() {
        super.enter();
        this.manager.controlsWindow.setMode('EXPLORE', this.manager.state.ui.formationMode);
    }
}

export class SceneBattle extends SceneBase {
    constructor(manager) {
        super(manager, [manager.hudWindow, manager.logWindow, manager.controlsWindow, manager.partyWindow, manager.bannerWindow]);
    }

    enter() {
        super.enter();
        this.manager.controlsWindow.setMode('BATTLE', false);
    }
}
