/* ====================================================================
    PHASER 3 OVERLAY (Strictly for Particles)
==================================================================== */
let phaserEmitter;

class ParticleScene extends Phaser.Scene {
    constructor() { super('ParticleScene'); }
    create() {
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
            emitting: false
        });
    }
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
new Phaser.Game(phaserConfig);

