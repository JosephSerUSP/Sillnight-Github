// Logging helpers for UI feedback
export const Log = {
    add: (msg, color = 'text-gray-300') => {
        const log = document.getElementById('game-log');
        if (!log) return;
        const div = document.createElement('div');
        div.className = `${color} border-l-2 border-transparent hover:border-gray-600 pl-1`;
        div.innerText = `> ${msg}`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    },
    battle: (msg) => Log.add(msg, 'text-yellow-200'),
    loot: (msg) => Log.add(msg, 'text-green-400')
};
