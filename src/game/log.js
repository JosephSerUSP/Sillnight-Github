// ------------------- UTILITY: LOGGING -------------------
let renderLog = null;

export const Log = {
    setRenderer(fn) {
        renderLog = fn;
    },
    add(msg, color = '#cbd5e1') {
        if (renderLog) {
            renderLog(msg, color);
        }
    },
    battle: (msg) => Log.add(msg, '#fef08a'),
    loot: (msg) => Log.add(msg, '#bbf7d0')
};

