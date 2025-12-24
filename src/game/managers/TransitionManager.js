export class TransitionManager {
    constructor() {
        if (TransitionManager.instance) return TransitionManager.instance;
        TransitionManager.instance = this;
        this.overlay = null;
        this.isTransitioning = false;
    }

    init() {
        if (this.overlay) return;

        // Create Overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'transition-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.zIndex = '9999'; // On top of everything
        this.overlay.style.opacity = '0';
        document.getElementById('game-container').appendChild(this.overlay);

        // Inject Styles
        const style = document.createElement('style');
        style.innerHTML = `
            /* Battle Start: Woosh (Flash + Blur) */
            @keyframes battle-woosh-in {
                0% { opacity: 0; backdrop-filter: blur(0px) brightness(1); transform: scale(1); }
                50% { opacity: 1; backdrop-filter: blur(10px) brightness(5); transform: scale(1.2); background: white; }
                100% { opacity: 1; backdrop-filter: blur(10px) brightness(1); transform: scale(1); background: black; }
            }
            @keyframes battle-woosh-out {
                0% { opacity: 1; background: black; }
                100% { opacity: 0; background: transparent; }
            }

            .transition-battle-in {
                animation: battle-woosh-in 0.8s ease-in forwards;
            }
            .transition-battle-out {
                animation: battle-woosh-out 0.8s ease-out forwards;
            }

            /* Map Transfer: Diagonal Swipe + Distortion */
            @keyframes map-swipe-out {
                0% {
                    transform: translateX(-100%) skewX(0deg);
                    opacity: 0;
                }
                50% {
                    transform: translateX(0%) skewX(-20deg);
                    opacity: 1;
                }
                100% {
                    transform: translateX(0%) skewX(0deg);
                    opacity: 1;
                    background: black;
                }
            }
             @keyframes map-swipe-in {
                0% {
                    transform: translateX(0%) skewX(0deg);
                    opacity: 1;
                    background: black;
                }
                50% {
                    transform: translateX(100%) skewX(20deg);
                    opacity: 1;
                }
                100% {
                    transform: translateX(100%) skewX(0deg);
                    opacity: 0;
                }
            }

            .transition-map-overlay {
                background: linear-gradient(135deg, #000 0%, #000 50%, #111 100%);
                width: 150%; /* Wider for skew */
                left: -25%;
            }

            .transition-map-out {
                animation: map-swipe-out 0.6s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
            }
            .transition-map-in {
                animation: map-swipe-in 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Plays a transition effect.
     * @param {string} type - 'BATTLE' or 'MAP'.
     * @param {Function} midCallback - Function to execute at the peak of the transition (e.g. scene switch).
     */
    async play(type, midCallback) {
        if (!this.overlay) this.init();
        this.isTransitioning = true;

        if (type === 'BATTLE') {
            // Part 1: Woosh In
            this.overlay.className = 'transition-battle-in';
            // Wait for mid-point (approx 600ms or end of animation?)
            // Animation is 0.8s. 50% is 0.4s.
            // But we want to hold black screen for setup.
            await this.wait(800);

            // Execute Switch
            if (midCallback) await midCallback();

            // Part 2: Fade Out
            this.overlay.className = 'transition-battle-out';
            await this.wait(800);

        } else if (type === 'MAP') {
            this.overlay.className = 'transition-map-overlay transition-map-out';
            await this.wait(600);

            if (midCallback) await midCallback();

            this.overlay.className = 'transition-map-overlay transition-map-in';
            await this.wait(600);
        }

        this.overlay.className = '';
        this.isTransitioning = false;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
