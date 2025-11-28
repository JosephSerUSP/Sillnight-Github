export class DialogueManager {
    constructor() {
        this.queue = [];
        this.active = false;
        this.overlay = null;
        this.textElement = null;
        this.speakerElement = null;
        this.resolveCurrent = null;
    }

    init() {
        // Prevent duplicate overlays
        if (document.getElementById('dialogue-overlay')) {
            this.overlay = document.getElementById('dialogue-overlay');
            this.speakerElement = this.overlay.querySelector('.text-yellow-400');
            this.textElement = this.overlay.querySelector('.font-mono');
            return;
        }

        // Create the DOM elements for dialogue
        this.overlay = document.createElement('div');
        this.overlay.id = 'dialogue-overlay';
        this.overlay.className = 'absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto hidden';
        this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'; // Transparent background, text box at bottom

        const box = document.createElement('div');
        box.className = 'bg-gray-900 border-t-2 border-white p-6 min-h-[150px] m-4 mb-8 bg-opacity-95';

        this.speakerElement = document.createElement('div');
        this.speakerElement.className = 'text-yellow-400 font-bold text-xl mb-2';
        this.speakerElement.innerText = 'Speaker';

        this.textElement = document.createElement('div');
        this.textElement.className = 'text-white text-lg font-mono leading-relaxed';
        this.textElement.innerText = '...';

        const continueHint = document.createElement('div');
        continueHint.className = 'text-right text-gray-500 text-sm mt-2 animate-pulse';
        continueHint.innerText = 'Click to continue...';

        box.appendChild(this.speakerElement);
        box.appendChild(this.textElement);
        box.appendChild(continueHint);
        this.overlay.appendChild(box);

        document.body.appendChild(this.overlay);

        // Click handler to advance
        this.overlay.addEventListener('click', () => {
            this.advance();
        });
    }

    /**
     * Shows a sequence of dialogue lines.
     * @param {Array<{speaker: string, text: string}>} lines
     * @returns {Promise<void>} Resolves when the sequence is finished.
     */
    show(lines) {
        if (!this.overlay) this.init();

        return new Promise((resolve) => {
            // If already active, queue this sequence?
            // For simplicity, we just overwrite for now or chain immediately.
            this.queue = [...lines];
            this.active = true;
            this.overlay.classList.remove('hidden');
            this.resolveSequence = resolve;
            this.showNextLine();
        });
    }

    showNextLine() {
        if (this.queue.length === 0) {
            this.end();
            return;
        }

        const line = this.queue.shift();
        this.speakerElement.innerText = line.speaker;
        this.textElement.innerText = line.text;
    }

    advance() {
        if (!this.active) return;
        this.showNextLine();
    }

    end() {
        this.active = false;
        this.overlay.classList.add('hidden');
        if (this.resolveSequence) {
            this.resolveSequence();
            this.resolveSequence = null;
        }
    }
}
