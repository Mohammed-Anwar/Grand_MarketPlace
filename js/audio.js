
/* ====================================================================
    WEB AUDIO API (Sound Synthesis)
==================================================================== */
const SoundFX = {
    ctx: null,
    audioBuffers: [], // Holds decoded .mp3 files
    loadingStarted: false,
    tradeBuffer: null, // Holds decoded trade.wave file
    init() { 
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.loadGameSounds();
        } 
    },
    canPlay() { return typeof GameState !== 'undefined' ? GameState.soundEnabled : true; },
    // Preload and decode all 6 coin sound files into memory
    async loadGameSounds() {
        if (this.loadingStarted) return;
        this.loadingStarted = true;

        // 1. Load the 6 coin sound variations
        for (let i = 1; i <= 6; i++) {
            try {
                const response = await fetch(`assets/sounds/coin_sounds/coin (${i}).mp3`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                this.ctx.decodeAudioData(arrayBuffer, (buffer) => {
                    this.audioBuffers.push(buffer);
                }, (err) => console.error("Error decoding coin sound:", err));
            } catch (e) {
                console.warn(`Failed to preload asset coin (${i}).mp3:`, e);
            }
        }

        // 2. Load the transaction click sound (trade.wav)
        try {
            const response = await fetch(`assets/sounds/trade.wav`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            this.ctx.decodeAudioData(arrayBuffer, (buffer) => {
                this.tradeBuffer = buffer;
            }, (err) => console.error("Error decoding trade.wav sound:", err));
        } catch (e) {
            console.warn(`Failed to preload asset trade.wav:`, e);
        }
    },
    // Global action sound for transactions (Buy, Sell, Upgrade, Quick Sell)
    playTradeClick() {
        if (!this.canPlay()) return;
        this.init();

        if (this.tradeBuffer) {
            const source = this.ctx.createBufferSource();
            const gain = this.ctx.createGain();

            source.buffer = this.tradeBuffer;

            // 🎲 Pitch variation for clicks (0.9 to 1.15 keeps the interface lively)
            const randomPitch = 0.9 + Math.random() * 0.25;
            source.playbackRate.setValueAtTime(randomPitch, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.7, this.ctx.currentTime); // Sound balancing

            source.connect(gain);
            gain.connect(this.ctx.destination);
            source.start(0);
        } else {
            // Fallback to basic synth click if file hasn't loaded yet
            this.playClick();
        }
    },
    playClick() {
        if (!this.canPlay()) return;
        this.init(); const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        
        // 🎲 Randomize regular click frequency (Base: 400Hz, adds/subtracts up to 60Hz)
        const randomFreq = 400 + (Math.random() * 120 - 60);
        const dropFreq = randomFreq - 250; // Keep the same downward sweep ratio

        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(randomFreq, now); 
        osc.frequency.exponentialRampToValueAtTime(dropFreq, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(now + 0.1);
    },
    playCoin() {
        if (!this.canPlay()) return;
        this.init();

        // If files are loaded, choose a random one and play with dynamic pitch variation!
        if (this.audioBuffers.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.audioBuffers.length);
            const buffer = this.audioBuffers[randomIndex];

            const source = this.ctx.createBufferSource();
            const gain = this.ctx.createGain();

            source.buffer = buffer;

            // Pitch modification (0.85 to 1.2 adds flavor variations)
            const randomPitch = 0.85 + Math.random() * 0.35; 
            source.playbackRate.setValueAtTime(randomPitch, this.ctx.currentTime);

            // 🔊 INCREASED VOLUME HERE (Changed from 0.3 to 0.9)
            gain.gain.setValueAtTime(1.5, this.ctx.currentTime); 

            source.connect(gain);
            gain.connect(this.ctx.destination);

            source.start(0);
        } else {
            // Fallback to old synth beep if assets aren't fetched or ready yet
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator(); const osc2 = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc1.type = 'sine'; osc2.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); osc1.frequency.setValueAtTime(1200, now + 0.08);
            osc2.frequency.setValueAtTime(1760, now + 0.04);
            
            // Also bumped fallback volume slightly just in case
            gain.gain.setValueAtTime(0.3, now); 
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc1.connect(gain); osc2.connect(gain); gain.connect(this.ctx.destination);
            osc1.start(); osc2.start(); osc1.stop(now + 0.25); osc2.stop(now + 0.25);
        }
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
        
        // 🎲 Randomize error buzzer frequency (Base: 120Hz, adds/subtracts up to 15Hz)
        const pitchModifier = (Math.random() * 30 - 15);
        const startFreq = 120 + pitchModifier;
        const stepFreq = 90 + pitchModifier;

        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(startFreq, now); 
        osc.frequency.setValueAtTime(stepFreq, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination); 
        osc.start(); osc.stop(now + 0.25);
    }
};