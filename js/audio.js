
/* ====================================================================
    WEB AUDIO API (Sound Synthesis)
==================================================================== */
const SoundFX = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    canPlay() { return typeof GameState !== 'undefined' ? GameState.soundEnabled : true; },
    playClick() {
        if (!this.canPlay()) return;
        this.init(); const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(now + 0.1);
    },
    playCoin() {
        if (!this.canPlay()) return;
        this.init(); const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator(); const osc2 = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc1.type = 'sine'; osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); osc1.frequency.setValueAtTime(1200, now + 0.08);
        osc2.frequency.setValueAtTime(1760, now + 0.04);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain); osc2.connect(gain); gain.connect(this.ctx.destination);
        osc1.start(); osc2.start(); osc1.stop(now + 0.25); osc2.stop(now + 0.25);
    },
    playForge() {
        if (!this.canPlay()) return;
        this.init(); const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(now + 0.2);

        const ping = this.ctx.createOscillator(); const pingGain = this.ctx.createGain();
        ping.type = 'sine'; ping.frequency.setValueAtTime(2200, now); ping.frequency.exponentialRampToValueAtTime(1000, now + 0.35);
        pingGain.gain.setValueAtTime(0.12, now); pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        ping.connect(pingGain); pingGain.connect(this.ctx.destination); ping.start(); ping.stop(now + 0.4);
    },
    playUpgrade() {
        if (!this.canPlay()) return;
        this.init(); const now = this.ctx.currentTime; const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.1, now + idx * 0.08); gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
            osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now + idx * 0.08); osc.stop(now + idx * 0.08 + 0.25);
        });
    },
    playError() {
        if (!this.canPlay()) return;
        this.init(); const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now); osc.frequency.setValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(now + 0.25);
    }
};