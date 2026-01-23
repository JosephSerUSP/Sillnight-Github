
/**
 * Manages floating damage/healing popups with physics.
 */
export class DamagePopupManager {
    constructor() {
        this.labels = [];
        this.container = null;
        this.lastTime = 0;

        // ensure container exists
        this.getContainer();

        // Start loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    getContainer() {
        if (!this.container) {
            let el = document.getElementById('damage-popup-overlay');
            if (!el) {
                el = document.createElement('div');
                el.id = 'damage-popup-overlay';
                el.className = 'absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50';
                const parent = document.getElementById('game-container') || document.body;
                parent.appendChild(el);
            }
            this.container = el;
        }
        return this.container;
    }

    /**
     * Spawns a popup at screen coordinates (x, y).
     * @param {number} x - Screen X.
     * @param {number} y - Screen Y.
     * @param {number|string} value - The text to display.
     * @param {boolean} [isCrit=false] - Is critical hit?
     * @param {string} [color] - Override color.
     */
    spawn(x, y, value, isCrit = false, color = null) {
        if (value === 0 || value === '0') return;
        const valNum = parseInt(value);
        const str = Math.abs(valNum).toString();
        const spacing = 18; // px spacing for digits
        const totalWidth = (str.length - 1) * spacing;
        const startX = x - (totalWidth / 2);

        const sharedVelocity = {
            x: (Math.random() - 0.5) * 2,
            y: -4 - (Math.random() * 2),
        };

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const el = document.createElement('div');
            el.className = 'absolute font-bold text-shadow-sm select-none';
            el.innerText = char;

            // Style
            if (color) {
                el.style.color = color;
            } else {
                if (valNum > 0) el.style.color = '#4ade80'; // Green (Healing)
                else if (valNum < 0) el.style.color = '#ffffff'; // White (Damage)
                else el.style.color = '#ffffff';
            }

            if (isCrit) {
                el.style.fontSize = '40px';
                el.style.color = '#fbbf24'; // Amber
            } else {
                el.style.fontSize = '32px';
            }
            el.style.textShadow = '2px 2px 0 #000';

            this.getContainer().appendChild(el);

            const digitX = startX + (i * spacing);

            this.labels.push({
                el: el,
                x: digitX,
                y: y,
                vx: sharedVelocity.x,
                vy: sharedVelocity.y,
                gravity: 0.25,
                elasticity: 0.6,
                floorY: y + 50,
                floorHit: false,
                life: 60,
                wait: i * 3
            });
        }
    }

    animate(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.lastTime = timestamp;

        for (let i = this.labels.length - 1; i >= 0; i--) {
            const p = this.labels[i];

            if (p.wait > 0) {
                p.wait--;
                p.el.style.opacity = '0';
                continue;
            } else {
                p.el.style.opacity = '1';
            }

            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;

            if (p.y >= p.floorY) {
                p.y = p.floorY;
                if (!p.floorHit) {
                    p.vy *= -p.elasticity;
                    p.floorHit = true;
                } else {
                    p.vy = 0;
                    p.vx = 0;
                    p.gravity = 0;
                }
            }

            p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;

            p.life--;
            if (p.life < 15) {
                p.el.style.opacity = (p.life / 15).toString();
            }

            if (p.life <= 0) {
                p.el.remove();
                this.labels.splice(i, 1);
            }
        }

        requestAnimationFrame(this.animate);
    }
}

export const PopupManager = new DamagePopupManager();
