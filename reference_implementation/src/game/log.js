// ------------------- UTILITY: LOGGING -------------------
/**
 * Utility for logging messages to the in-game log.
 * @namespace Log
 */
export const Log = {
    history: [],

    /**
     * Adds a generic message to the game log.
     * @param {string} msg - The message to display.
     * @param {string} [color='text-gray-300'] - The CSS class for the text color.
     */
    add: (msg, color = 'text-gray-300') => {
        Log.history.push(msg);
        const log = document.getElementById('game-log');
        if (!log) return;
        const div = document.createElement('div');
        div.className = `${color} border-l-2 border-transparent hover:border-gray-600 pl-1`;
        div.innerText = `> ${msg}`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    },
    /**
     * Adds a battle-related message to the game log.
     * @param {string} msg - The message to display.
     */
    battle: (msg) => Log.add(msg, 'text-yellow-200'),
    /**
     * Adds a loot-related message to the game log.
     * @param {string} msg - The message to display.
     */
    loot: (msg) => Log.add(msg, 'text-green-400')
};
