/* ====================================================================
    MARKET CONTROLLER SUB-MODULE
==================================================================== */
export const MarketController = {
    cycleMarketTier(app) {
        SoundFX.playClick();
        GameState.marketTierFilter++;
        if (GameState.marketTierFilter > GameState.maxMarketTier) {
            GameState.marketTierFilter = 0;
        }
        GameState.save();
        app.updateTierButtonText();
    },

    updateTierButtonText() {
        const btn = document.getElementById('btn-market-tier');
        if (btn) {
            btn.innerText = `🔍 Tier: ${GameState.marketTierFilter} / ${GameState.maxMarketTier}`;
        }
    },

    createRandomOffer(app, slotId) {
        const unlockedKeys = Object.keys(GameState.products).filter(k => GameState.products[k].unlocked);
        const hasEnchanted = GameState.hasEnchantedItem();
        const isBuy = Math.random() > 0.4;
        const pKey = unlockedKeys[Math.floor(Math.random() * unlockedKeys.length)];
        const prod = GameState.products[pKey];
        
        const maxT = Math.min(GameState.maxMarketTier, GameState.marketTierFilter);
        let tier = 0;
        const weights = [35, 25, 18, 10, 7, 5].slice(0, maxT + 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        for (let i = 0; i <= maxT; i++) {
            rand -= weights[i];
            if (rand <= 0) { tier = i; break; }
        }
        
        let isEnchantedDeal = (maxT >= 5 && hasEnchanted && Math.random() > 0.90);
        let basePrice = Math.floor(Math.random() * (prod.maxPrice - prod.minPrice + 1)) + prod.minPrice;
        let calcPrice = isEnchantedDeal ? Math.floor(Math.random() * (prod.enchMax - prod.enchMin + 1)) + prod.enchMin : Math.round(basePrice * Math.pow(11, tier));
        
        let qty = 1;
        if (!isEnchantedDeal) {
            if (tier === 0) qty = Math.floor(Math.random() * 12) + 4;
            else if (tier === 1) qty = Math.floor(Math.random() * 6) + 2;
            else if (tier === 2) qty = Math.floor(Math.random() * 3) + 1;
        }

        return { id: slotId, type: isBuy ? 'BUY' : 'SELL', productKey: pKey, stars: isEnchantedDeal ? 'enchanted' : tier, pricePerUnit: calcPrice, qty: qty, cooldownActive: false, cooldownTimer: 0 };
    },

    generateMissingOffers(app) {
        const currentCount = GameState.offers.length;
        for (let i = currentCount; i < GameState.activeSlotsCount; i++) {
            GameState.offers.push(this.createRandomOffer(app, i));
        }
    },

    shuffleMarket(app) {
        if (GameState.gold >= 10) {
            GameState.gold -= 10; GameState.offers = []; this.generateMissingOffers(app);
            GameState.updateNetWorth(); GameState.save();
            SoundFX.playTradeClick(); app.refreshUI();
        } else {
            SoundFX.playError(); app.showToast("Not enough gold to shuffle!");
        }
    },

    tickTimers(app) {
        let changed = false; const now = Date.now();
        let restockedIndices = [];

        GameState.offers.forEach((offer, idx) => {
            if (offer.cooldownActive) {
                const remaining = Math.ceil((offer.cooldownEndTime - now) / 1000);
                if (remaining <= 0) { 
                    GameState.offers[idx] = this.createRandomOffer(app, offer.id); 
                    changed = true; 
                    restockedIndices.push(idx);
                } else {
                    offer.cooldownTimer = remaining;
                    const tDom = document.getElementById(`timer-txt-${offer.id}`);
                    if (tDom) tDom.innerText = `Arrives in ${remaining}s`;
                }
            }
        });

        if (changed) { 
            GameState.save(); 
            if (app.currentTab === 'market') {
                this.renderMarket(app); 
                restockedIndices.forEach(idx => {
                    const newCard = document.querySelectorAll('.market-item')[idx];
                    if (newCard) {
                        newCard.classList.add('flash-in');
                        setTimeout(() => newCard.classList.remove('flash-in'), 1000);
                    }
                });
            } 
        }
    },

    executeTrade(app, idx, e) {
        const offer = GameState.offers[idx];
        if (offer.cooldownActive) return;

        const totalCost = offer.pricePerUnit * offer.qty;
        const key = `${offer.productKey}_${offer.stars}`;

        if (offer.type === 'BUY') {
            if (GameState.gold < totalCost) { SoundFX.playError(); app.showToast("Insufficient gold!"); return; }
            if (GameState.getInventoryCount(key) + offer.qty > GameState.maxInventoryStack) { 
                SoundFX.playError(); app.showToast("Warehouse full!"); return; 
            }
        } else {
            if (GameState.getInventoryCount(key) < offer.qty) { SoundFX.playError(); app.showToast("Not enough to sell!"); return; }
        }

        const cardEl = e.target.closest('.market-item');
        cardEl.classList.add('flash-out');

        setTimeout(() => {
            this.performTradeLogic(app, idx);
            const newCard = document.querySelectorAll('.market-item')[idx];
            if (newCard) {
                newCard.classList.add('flash-in');
                setTimeout(() => newCard.classList.remove('flash-in'), 1000);
            }
        }, 100);
    },

    performTradeLogic(app, idx) {
        const offer = GameState.offers[idx];
        const totalCost = offer.pricePerUnit * offer.qty;
        const key = `${offer.productKey}_${offer.stars}`;

        if (offer.type === 'BUY') {
            GameState.gold -= totalCost; 
            GameState.modifyInventory(key, offer.qty);
            app.displayedGold = GameState.gold; 
        } else {
            GameState.gold += totalCost; 
            GameState.modifyInventory(key, -offer.qty);
        }

        uiEventBridge(offer, totalCost); // Dispatches custom actions if necessary
        GameState.totalTrades++;
        offer.cooldownActive = true;
        offer.cooldownEndTime = Date.now() + (GameState.offerCooldowns * 1000);
        offer.cooldownTimer = GameState.offerCooldowns;
        
        SoundFX.playTradeClick();
        GameState.updateNetWorth(); 
        GameState.save(); 
        app.refreshUI();
    },

    renderMarket(app) {
        const list = document.getElementById('market-list');
        list.innerHTML = '';
        
        GameState.offers.forEach((offer, idx) => {
            if (offer.cooldownActive) {
                list.innerHTML += `
                    <div class="market-item cooldown">
                        <span style="font-size: 14px; font-weight: 700; color: #e8d5a8;">⏳ Restocking Deal...</span>
                        <span style="font-size: 12px; font-weight: 600; color: #ffd700;" id="timer-txt-${offer.id}">Arrives in ${offer.cooldownTimer}s</span>
                    </div>`;
                return;
            }
            let offerTier = offer.stars === 'enchanted' ? 5 : parseInt(offer.stars);
            if (offerTier > GameState.marketTierFilter) {
                GameState.offers[idx] = this.createRandomOffer(app, offer.id);
                offer = GameState.offers[idx];
                GameState.save();
            }
            const prod = GameState.products[offer.productKey];
            const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];
            let starHTML = offer.stars === 'enchanted' ? '<div class="stars enchanted">✨</div>' : (offer.stars > 0 ? `<div class="stars ${colors[offer.stars]}">★</div>` : '');
            let nameStr = offer.stars === 'enchanted' ? `Enchanted ${prod.name} ✨` : prod.name;
            let isRareClass = offer.stars === 'enchanted' ? 'enchanted' : (offer.stars >= 4 ? 'rare' : '');
            
            list.innerHTML += `
                <div class="market-item ${offer.type === 'SELL' ? 'sell-deal' : ''} ${isRareClass}">
                    <div class="market-item-icon" style="position: relative;">
                        ${prod.emoji}
                        ${starHTML}
                        <div class="item-qty">x${offer.qty}</div>
                    </div>
                    <div class="market-item-info">
                        <div class="market-item-name">${nameStr}</div>
                    </div>
                    <div class="market-price-col">
                        <div class="market-item-price">${offer.pricePerUnit}</div>
                        <div class="market-item-total">Total: ${offer.pricePerUnit * offer.qty}</div>
                    </div>
                    <button class="btn-trade ${offer.type.toLowerCase()}" onclick="GameApp.executeTrade(${idx}, event)">
                        ${offer.type === 'BUY' ? 'Buy Pack' : 'Sell Pack'}
                    </button>
                </div>`;
        });

        const maxSlots = GameState.activeSlotsCount >= 6;
        if (!maxSlots) {
            const slotCost = [0, 0, 200, 600, 1800, 5000, 15000][GameState.activeSlotsCount + 1] || 999999;
            list.innerHTML += `
                <div class="market-item upgrade-slot-card" style="cursor: pointer; border: 3px dashed #bda071; background: rgba(131, 83, 44, 0.25);" onclick="GameApp.buySlot(event)">
                    <div class="market-item-icon" style="background: transparent; border: 2px dashed #bda071; font-size: 24px;">➕</div>
                    <div class="market-item-info">
                        <div class="market-item-name" style="color: #fff;">🏪 Expand Market Slot</div>
                        <div style="font-size: 11px; color: #e8d5a8; font-weight: 600; margin-top: 2px;">Unlock Offer Card #${GameState.activeSlotsCount + 1}</div>
                    </div>
                    <div class="market-price-col"><div class="market-item-price">${slotCost}g</div></div>
                    <button class="btn-trade buy" style="pointer-events: none;">Unlock</button>
                </div>`;
        }
    },

    buySlot(app, e) {
        const cost = [0, 0, 200, 600, 1800, 5000, 15000][GameState.activeSlotsCount + 1];
        if (GameState.gold >= cost) { 
            GameState.gold -= cost; 
            GameState.activeSlotsCount++; 
            app.onUpgSuccess(e); 
            GameState.offers.push(this.createRandomOffer(app, GameState.activeSlotsCount - 1));
            this.renderMarket(app);
            GameState.save();
        } else { 
            SoundFX.playError(); app.showToast("Not enough gold!"); 
        }
    }
};

// Internal utility helper to stay abstract
function uiEventBridge(offer, totalCost) {
    // Keeps reference context loose if needed down the road
}