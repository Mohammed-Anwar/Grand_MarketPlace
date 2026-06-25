/* ====================================================================
    PHASER 3 OVERLAY (Strictly for Particles and Visuals)
==================================================================== */
let phaserEmitter;
let phaserSceneInstance; 

class ParticleScene extends Phaser.Scene {
    constructor() { super('ParticleScene'); }

    preload() {
        // Preload your coin image (make sure the path is correct relative to your HTML file)
        this.load.image('coin', 'assets/coin.png');
    }

    create() {
        phaserSceneInstance = this; 

        // Generate a simple yellow star texture dynamically for sparks
        let canvas = this.textures.createCanvas('spark', 16, 16);
        let ctx = canvas.context;
        ctx.fillStyle = '#ffdf00';
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();

        // Main explosion emitter
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

// --- VALUE-DEPENDENT GLOBAL FLYING COIN FUNCTION ---
function spawnPhaserFlyingCoin(startX, startY, goldEarned) {
    if (!phaserSceneInstance) return;

    // 1. Locate the targets (DOM elements) dynamically
    const headerGoldEl = document.getElementById('header-gold') || document.getElementById('hub-gold');
    let targetX = window.innerWidth / 2; 
    let targetY = 50;

    if (headerGoldEl) {
        const rect = headerGoldEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 4; 
        targetY = rect.top + rect.height / 2;
    }

    // 2. Calculate coin count: 1 coin per 50 gold, max of 10 coins
    // Math.max(1, ...) ensures at least 1 coin spawns even for sales less than 50g
    let coinCount = Math.ceil(goldEarned / 50);
    coinCount = Math.min(coinCount, 10); 
    coinCount = Math.max(1, coinCount);

    const totalDuration = 900; // Total flight time in ms

    for (let i = 0; i < coinCount; i++) {
        // Subtle offset so they don't completely overlap
        const offsetX = Phaser.Math.Between(-10, 10);
        const offsetY = Phaser.Math.Between(-10, 10);

        // Create the Coin Image starting tiny (Scale 0)
        const coin = phaserSceneInstance.add.image(startX + offsetX, startY + offsetY, 'coin');
        coin.setScale(0); 
        coin.setDepth(10);   
        coin.setAngle(Phaser.Math.Between(0, 360));

        // Create a unique particle trailing emitter for this specific coin
        const trail = phaserSceneInstance.add.particles(0, 0, 'spark', {
            speed: { min: 10, max: 40 },
            scale: { start: 0.4, end: 0 },
            lifespan: 350,
            blendMode: 'ADD',
            frequency: 20 
        });
        trail.startFollow(coin);

        const delayTime = i * 100; // Staggered delay per coin

        // --- TWEEN 1: Position & Continuous Rotation ---
        phaserSceneInstance.tweens.add({
            targets: coin,
            x: targetX,
            y: targetY,
            angle: coin.angle + 540,
            delay: delayTime,
            duration: totalDuration,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                SoundFX.playCoin();
                GameApp.animateGoldCounter();
                
                // Clean up elements
                coin.destroy();
                trail.stop();
                phaserSceneInstance.time.delayedCall(350, () => {
                    trail.destroy();
                });
            }
        });

        // --- TWEEN 2: The Scale Timeline (Spawn Small -> Grow Fast -> Shrink down) ---
        const growDuration = totalDuration / 3; 
        const shrinkDuration = totalDuration - growDuration;

        phaserSceneInstance.tweens.chain({
            targets: coin,
            delay: delayTime,
            tweens: [
                {
                    scale: 0.15,          
                    duration: growDuration,
                    ease: 'Back.easeOut' 
                },
                {
                    scale: 0,             
                    duration: shrinkDuration,
                    ease: 'Cubic.easeIn'
                }
            ]
        });
    }
}

// --- GLOBAL FLOATING TEXT FUNCTION ---
function spawnPhaserFloatingText(x, y, textStr, color = '#ffd700') {
    if (!phaserSceneInstance) return;

    const txt = phaserSceneInstance.add.text(x, y, textStr, {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: '22px',
        fontWeight: '800',
        color: color,
        stroke: '#3b2210', 
        strokeThickness: 5
    });
    txt.setOrigin(0.5);

    phaserSceneInstance.tweens.add({
        targets: txt,
        y: y - 70, 
        alpha: 0,  
        duration: 850,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            txt.destroy(); 
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