import { MarketController } from './controllers/market.js';
import { HubController } from './controllers/hub.js';
import { UpgradesController } from './controllers/upgrades.js';

window.GameApp = {
    currentTab: 'market',
    forgeBatchCount: 1,
    displayedGold: 0, 
    goldCounterInterval: null,

    init() {
        document.querySelectorAll('.screen-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setTab(tab.dataset.view, true);
            });
        });

        const hasSave = GameState.load();
        if (!hasSave) this.generateMissingOffers();
        else {
            GameState.offers.forEach((offer, idx) => {
                if (!offer.cooldownActive && offer.cooldownEndTime && offer.cooldownEndTime < Date.now()) {
                    GameState.offers[idx] = this.createRandomOffer(idx);
                }
            });
        }
        this.setTab(this.currentTab, false);
        this.displayedGold = GameState.gold;
        this.refreshUI();

        setInterval(() => this.tickTimers(), 1000);
    },

    setTab(viewName, playSound = false) {
        if (playSound) SoundFX.playClick();
        document.querySelectorAll('.screen-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        const targetTab = document.querySelector(`.screen-tab[data-view="${viewName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            const titleEl = document.getElementById('desktop-view-title');
            if(titleEl) titleEl.innerText = targetTab.innerText;
        }
        
        const targetView = document.getElementById('view-' + viewName);
        if (targetView) targetView.classList.add('active');
        
        this.currentTab = viewName;
        this.refreshUI();
    },

    refreshUI() {
        const currentTxt = `💰 Balance: ${this.displayedGold}g`;
        if (document.getElementById('header-gold')) document.getElementById('header-gold').innerText = currentTxt;
        if (document.getElementById('hub-gold')) document.getElementById('hub-gold').innerText = currentTxt;
        
        this.updateTierButtonText();
        if (this.currentTab === 'hub') this.renderHub();
        else if (this.currentTab === 'market') this.renderMarket();
        else if (this.currentTab === 'upgrades') this.renderUpgrades();
    },

    // --- SUB-CONTROLLER WRAPPERS/BRIDGES ---
    renderMarket() { MarketController.renderMarket(this); },
    cycleMarketTier() { MarketController.cycleMarketTier(this); },
    updateTierButtonText() { MarketController.updateTierButtonText(); },
    createRandomOffer(slotId) { return MarketController.createRandomOffer(this, slotId); },
    generateMissingOffers() { MarketController.generateMissingOffers(this); },
    shuffleMarket() { MarketController.shuffleMarket(this); },
    tickTimers() { MarketController.tickTimers(this); },
    executeTrade(idx, e) { MarketController.executeTrade(this, idx, e); },
    buySlot(e) { MarketController.buySlot(this, e); },
    
    renderHub() { HubController.renderHub(this); },
    openQuickSellModal() { HubController.openQuickSellModal(); },
    closeQuickSellModal() { HubController.closeQuickSellModal(); },
    sliderQuickSellBatch(val) { HubController.sliderQuickSellBatch(val); },
    adjustQuickSellBatch(dir) { HubController.adjustQuickSellBatch(dir); },
    executeQuickSell(e) { HubController.executeQuickSell(this, e); },

    renderUpgrades() { UpgradesController.renderUpgrades(this); },
    buyMarketTier(e) { UpgradesController.buyMarketTier(this, e); },

    // --- ANIMATION & FX TIMELINES ---
    animateGoldCounter() {
        if (this.goldCounterInterval) clearInterval(this.goldCounterInterval);
        const targetGold = GameState.gold;
        const goldDifference = Math.abs(targetGold - this.displayedGold);
        if (goldDifference === 0) return;

        const stepTime = Math.max(10, Math.min(50, 300 / goldDifference)); 
        const stepAmount = Math.ceil(goldDifference / 30);

        this.goldCounterInterval = setInterval(() => {
            if (this.displayedGold < targetGold) {
                this.displayedGold += stepAmount;
                if (this.displayedGold > targetGold) this.displayedGold = targetGold;
            } else if (this.displayedGold > targetGold) {
                this.displayedGold -= stepAmount;
                if (this.displayedGold < targetGold) this.displayedGold = targetGold;
            }

            const txt = `💰 Balance: ${this.displayedGold}g`;
            if (document.getElementById('header-gold')) document.getElementById('header-gold').innerText = txt;
            if (document.getElementById('hub-gold')) document.getElementById('hub-gold').innerText = txt;

            if (this.displayedGold === targetGold) {
                clearInterval(this.goldCounterInterval);
                this.goldCounterInterval = null;
                const containerEl = document.getElementById('header-gold') || document.getElementById('hub-gold');
                if(containerEl) {
                    containerEl.style.transform = "scale(1.1)";
                    setTimeout(() => containerEl.style.transform = "scale(1)", 100);
                }
            }
        }, stepTime);
    },

    spawnFloatingText(x, y, textStr, color) {
        if (typeof spawnPhaserFloatingText === 'function') spawnPhaserFloatingText(x, y, textStr, color);
    },
    showToast(msg) {
        const cont = document.getElementById('toast-container');
        const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
        cont.appendChild(t); setTimeout(() => t.remove(), 2500);
    },
    triggerExplosion(e) {
        if(phaserEmitter && e) {
            const rect = e.target.getBoundingClientRect();
            phaserEmitter.setPosition(rect.left + rect.width/2, rect.top + rect.height/2);
            phaserEmitter.explode(15);
        }
    },
    triggerForgeExplosion() {
        if(phaserEmitter) {
            phaserEmitter.setPosition(window.innerWidth/2, window.innerHeight/2);
            phaserEmitter.explode(30);
        }
    },
    upgCardHTML(title, desc, isMax, cost, onclickCode) {
        let btnHTML = isMax ? `<button class="btn-upg" disabled>Unlocked ✔</button>` : `<button class="btn-upg" onclick="${onclickCode}">${cost.toLocaleString()}g</button>`;
        return `<div class="upgrade-card wood-panel"><div class="upg-info"><h4>${title}</h4><p>${desc}</p></div>${btnHTML}</div>`;
    },
    buyWarehouse(next, cost, e) {
        if (GameState.gold >= cost) { GameState.gold -= cost; GameState.maxInventoryStack = next; this.onUpgSuccess(e); }
        else { SoundFX.playError(); this.showToast("Not enough gold!"); }
    },
    buyProduct(key, cost, e) {
        if (GameState.gold >= cost) { GameState.gold -= cost; GameState.products[key].unlocked = true; this.onUpgSuccess(e); }
        else { SoundFX.playError(); this.showToast("Not enough gold!"); }
    },
    onUpgSuccess(e) { this.displayedGold = GameState.gold; SoundFX.playUpgrade(); this.triggerExplosion(e); GameState.updateNetWorth(); GameState.save(); this.refreshUI(); },

    // --- MODAL UTILS ---
    openMenuModal() {
        SoundFX.playClick();
        document.getElementById('btn-toggle-sound').innerText = GameState.soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        document.getElementById('menu-modal').style.display = 'flex';
    },
    closeMenuModal() { SoundFX.playClick(); document.getElementById('menu-modal').style.display = 'none'; },
    toggleSound() {
        GameState.soundEnabled = !GameState.soundEnabled; GameState.save();
        document.getElementById('btn-toggle-sound').innerText = GameState.soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        if(GameState.soundEnabled) SoundFX.playClick();
    },
    showAboutModal() { SoundFX.playClick(); document.getElementById('menu-modal').style.display = 'none'; document.getElementById('about-modal').style.display = 'flex'; },
    closeAboutModal() { SoundFX.playClick(); document.getElementById('about-modal').style.display = 'none'; },
    restartGame() {
        const btn = document.getElementById('btn-restart');
        if (btn.innerText === "⚠️ Restart Game") {
            SoundFX.playError(); btn.innerText = "Are you sure? Click again to wipe save!";
            btn.style.background = "linear-gradient(180deg, #b00000 0%, #7a0000 100%)";
            setTimeout(() => {
                if(btn) {
                    btn.innerText = "⚠️ Restart Game";
                    btn.style.background = "linear-gradient(180deg, #e85d3a 0%, #c44020 100%)";
                }
            }, 3500);
        } else {
            localStorage.removeItem('grand_marketplace_save'); window.location.reload();
        }
    },
    openForgeModal(key) {
        this.forgeBatchCount = 1;
        const parts = key.split('_'); const pKey = parts[0]; const stars = parts[1];
        const prod = GameState.products[pKey];
        const nextStars = stars === '5' ? 'enchanted' : (parseInt(stars) + 1).toString();
        const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];

        document.getElementById('f-src-emoji').innerText = prod.emoji;
        document.getElementById('f-src-stars').innerHTML = stars === 'enchanted' ? '✨' : (stars > 0 ? '★' : '');
        document.getElementById('f-src-stars').className = `f-stars stars ${stars === 'enchanted' ? 'enchanted' : (colors[stars] || '')}`;

        document.getElementById('f-dst-emoji').innerText = prod.emoji;
        document.getElementById('f-dst-stars').innerHTML = nextStars === 'enchanted' ? '✨' : '★';
        document.getElementById('f-dst-stars').className = `f-stars stars ${nextStars === 'enchanted' ? 'enchanted' : colors[nextStars]}`;

        this.updateForgeMath(key, prod, nextStars);
        document.getElementById('forge-modal').style.display = 'flex';
    },
    closeForgeModal() { document.getElementById('forge-modal').style.display = 'none'; },
    adjustForgeBatch(dir) {
        const key = GameState.selectedInventoryItem;
        const max = Math.floor(GameState.getInventoryCount(key) / 9);
        if (dir === -1 && this.forgeBatchCount > 1) { SoundFX.playClick(); this.forgeBatchCount--; }
        else if (dir === 1 && this.forgeBatchCount < max) { SoundFX.playClick(); this.forgeBatchCount++; }
        else { SoundFX.playError(); return; }
        
        const parts = key.split('_'); 
        this.updateForgeMath(key, GameState.products[parts[0]], parts[1] === '5' ? 'enchanted' : (parseInt(parts[1]) + 1).toString());
    },
    updateForgeMath(key, prod, nextStars) {
        document.getElementById('forge-batch-count').innerText = this.forgeBatchCount;
        const destKey = `${key.split('_')[0]}_${nextStars}`;
        document.getElementById('forge-math-text').innerHTML = `Consume: ${this.forgeBatchCount * 9}x ${GameState.getItemName(key, true)}<br>Produce: ${this.forgeBatchCount}x ${GameState.getItemName(destKey, true)}`;
    },
    executeForge(e) {
        const key = GameState.selectedInventoryItem;
        const parts = key.split('_'); const destKey = `${parts[0]}_${parts[1] === '5' ? 'enchanted' : (parseInt(parts[1]) + 1).toString()}`;
        if (GameState.getInventoryCount(destKey) + this.forgeBatchCount > GameState.maxInventoryStack) { SoundFX.playError(); this.showToast("Destination stack full!"); return; }

        GameState.modifyInventory(key, -(this.forgeBatchCount * 9));
        GameState.modifyInventory(destKey, this.forgeBatchCount);
        GameState.totalCrafts++;
        if (GameState.getInventoryCount(key) <= 0) GameState.selectedInventoryItem = null;
        
        this.triggerForgeExplosion(); SoundFX.playForge();
        GameState.save(); this.closeForgeModal(); this.refreshUI();
    }
};

// Start initialization once the engine finishes mounting window bindings
window.addEventListener('DOMContentLoaded', () => GameApp.init());