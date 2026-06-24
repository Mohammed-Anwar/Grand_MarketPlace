/* ====================================================================
    PHASER 3 OVERLAY (Strictly for Particles)
==================================================================== */
/* ====================================================================\
    PHASER 3 OVERLAY (Strictly for Particles)
==================================================================== */
let phaserEmitter;
let phaserSceneInstance; // <-- Added to hold a reference to the scene

class ParticleScene extends Phaser.Scene {
    constructor() { super('ParticleScene'); }
    create() {
        phaserSceneInstance = this; // <-- Capture the scene reference here

        // Generate a simple yellow star texture dynamically
        let canvas = this.textures.createCanvas('spark', 16, 16);
        let ctx = canvas.context;
        ctx.fillStyle = '#ffdf00';
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();

        phaserEmitter = this.add.particles(0, 0, 'spark', {
            lifespan: 600,
            speed: { min: 80, max: 200 },
            scale: { start: 0.6, end: 0 },
            quantity: 12,
            blendMode: 'ADD',
            emitting: false,
        });
    }
}

// --- NEW GLOBAL FLOATING TEXT FUNCTION ---
function spawnPhaserFloatingText(x, y, textStr, color = '#ffd700') {
    if (!phaserSceneInstance) return;

    // Create bold stylized game text directly in Phaser
    const txt = phaserSceneInstance.add.text(x, y, textStr, {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: '22px',
        fontWeight: '800',
        color: color,
        stroke: '#3b2210', // Dark brown outline matching your UI theme
        strokeThickness: 5
    });
    txt.setOrigin(0.5);

    // Animate the text rising and fading out using Phaser Tweens
    phaserSceneInstance.tweens.add({
        targets: txt,
        y: y - 70, // Rise up 70 pixels
        alpha: 0,  // Fade to completely transparent
        duration: 850,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            txt.destroy(); // Clean up memory once done
        }
    });
}

const phaserConfig = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    scene: [ParticleScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
const phaserGame = new Phaser.Game(phaserConfig);

