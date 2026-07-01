

/* ====================================================================
    DOM APP CONTROLLER
==================================================================== */
const GameApp = {
    currentTab: 'market',
    forgeBatchCount: 1,
    displayedGold: GameState.gold, 
    goldCounterInterval: null,
    // --- NEW DEDICATED TAB FUNCTION ---
    setTab(viewName, playSound = false) {
        if (playSound) SoundFX.playClick();
        
        // 1. Clear all active classes
        document.querySelectorAll('.screen-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // 2. Find the new tab and activate it
        const targetTab = document.querySelector(`.screen-tab[data-view="${viewName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            
            // Update desktop title
            const titleEl = document.getElementById('desktop-view-title');
            if(titleEl) titleEl.innerText = targetTab.innerText;
        }
        
        // 3. Find the new view and activate it
        const targetView = document.getElementById('view-' + viewName);
        if (targetView) targetView.classList.add('active');
        
        this.currentTab = viewName;
        this.refreshUI();
    },

    init() {
        // Setup Tabs
        document.querySelectorAll('.screen-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setTab(tab.dataset.view, true); // true = play sound on user click
            });
        });

        // Load Save Data
        const hasSave = GameState.load();
        if (!hasSave) this.generateMissingOffers();
        else {
            // Check if inactive offers need refreshing due to offline elapsed time
            GameState.offers.forEach((offer, idx) => {
                if (!offer.cooldownActive && offer.cooldownEndTime && offer.cooldownEndTime < Date.now()) {
                    GameState.offers[idx] = this.createRandomOffer(offer.id);
                }
            });
        }
        this.setTab(this.currentTab, false);
        this.displayedGold = GameState.gold;
        this.refreshUI();

        // Start 1-second Cooldown Ticker
        setInterval(() => this.tickTimers(), 1000);
    }, 

    // Replace or update your standard gold update code with this function
    animateGoldCounter() {
        // Clear any previous ongoing counters so they don't fight each other
        if (this.goldCounterInterval) clearInterval(this.goldCounterInterval);

        const targetGold = GameState.gold;

        // Determine how fast it ticks up based on how much gold was earned
        const goldDifference = Math.abs(targetGold - this.displayedGold);
        if (goldDifference === 0) return;

        // Adjust speed dynamically: larger gains roll faster
        const stepTime = Math.max(10, Math.min(50, 300 / goldDifference)); 
        const stepAmount = Math.ceil(goldDifference / 30); // finish counting in roughly 30 steps

        this.goldCounterInterval = setInterval(() => {
            if (this.displayedGold < targetGold) {
                this.displayedGold += stepAmount;
                if (this.displayedGold > targetGold) this.displayedGold = targetGold;
            } else if (this.displayedGold > targetGold) {
                this.displayedGold -= stepAmount;
                if (this.displayedGold < targetGold) this.displayedGold = targetGold;
            }

            // Update the DOM text strings across both possible UI panels
            const txt = `💰 Balance: ${this.displayedGold}g`;
            const headerEl = document.getElementById('header-gold');
            const hubEl = document.getElementById('hub-gold');
            
            if (headerEl) headerEl.innerText = txt;
            if (hubEl) hubEl.innerText = txt;

            // Stop counting once we reach the exact total gold value
            if (this.displayedGold === targetGold) {
                clearInterval(this.goldCounterInterval);
                this.goldCounterInterval = null;
                
                // Optional Juice: Quick scale pop to show it finished
                const containerEl = headerEl || hubEl;
                if(containerEl) {
                    containerEl.style.transform = "scale(1.1)";
                    setTimeout(() => containerEl.style.transform = "scale(1)", 100);
                }
            }
        }, stepTime);
    },
    // Bridges standard UI events over to our Phaser overlay
    spawnFloatingText(x, y, textStr, color) {
        if (typeof spawnPhaserFloatingText === 'function') {
            spawnPhaserFloatingText(x, y, textStr, color);
        }
    },

    refreshUI() {
        // Inside refreshUI():
        // Instead of updating innerText directly, use the tracking value for static redraws
        const currentTxt = `💰 Balance: ${this.displayedGold}g`;
        if (document.getElementById('header-gold')) document.getElementById('header-gold').innerText = currentTxt;
        if (document.getElementById('hub-gold')) document.getElementById('hub-gold').innerText = currentTxt;
        
        
        this.updateTierButtonText();
        if (this.currentTab === 'hub') this.renderHub();
        else if (this.currentTab === 'market') this.renderMarket();
        else if (this.currentTab === 'upgrades') this.renderUpgrades();
    },

    showToast(msg) {
        const cont = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = 'toast'; t.innerText = msg;
        cont.appendChild(t);
        setTimeout(() => t.remove(), 2500);
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
    
    // --- MENU & MODALS LOGIC ---
    openMenuModal() {
        SoundFX.playClick();
        document.getElementById('btn-toggle-sound').innerText = GameState.soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        document.getElementById('menu-modal').style.display = 'flex';
    },
    
    closeMenuModal() {
        SoundFX.playClick();
        document.getElementById('menu-modal').style.display = 'none';
    },
    
    toggleSound() {
        GameState.soundEnabled = !GameState.soundEnabled;
        GameState.save();
        document.getElementById('btn-toggle-sound').innerText = GameState.soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        // Only play sound immediately if we just turned it ON
        if(GameState.soundEnabled) SoundFX.playClick();
    },
    
    showAboutModal() {
        SoundFX.playClick();
        document.getElementById('menu-modal').style.display = 'none';
        document.getElementById('about-modal').style.display = 'flex';
    },
    
    closeAboutModal() {
        SoundFX.playClick();
        document.getElementById('about-modal').style.display = 'none';
    },
    
    restartGame() {
        const btn = document.getElementById('btn-restart');
        if (btn.innerText === "⚠️ Restart Game") {
            SoundFX.playError();
            btn.innerText = "Are you sure? Click again to wipe save!";
            btn.style.background = "linear-gradient(180deg, #b00000 0%, #7a0000 100%)";
            
            // Reset styling if they don't click again within 3 seconds
            setTimeout(() => {
                if(btn) {
                    btn.innerText = "⚠️ Restart Game";
                    btn.style.background = "linear-gradient(180deg, #e85d3a 0%, #c44020 100%)";
                }
            }, 3500);
        } else {
            // Execute Delete!
            localStorage.removeItem('grand_marketplace_save');
            window.location.reload();
        }
    },
    // tier button in the market view
    cycleMarketTier() {
        SoundFX.playClick();
        GameState.marketTierFilter++;
        // If it exceeds the max unlocked tier, wrap around back to 0
        if (GameState.marketTierFilter > GameState.maxMarketTier) {
            GameState.marketTierFilter = 0;
        }
        GameState.save();
        this.updateTierButtonText();
        
    },

    updateTierButtonText() {
        const btn = document.getElementById('btn-market-tier');
        if (btn) {
            btn.innerText = `🔍 Tier: ${GameState.marketTierFilter} / ${GameState.maxMarketTier}`;
        }
    },

    // --- DEALS LOGIC ---
    createRandomOffer(slotId) {
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
        
        // Enchanted deals only appear if Tier 5 is unlocked AND filter is at 5
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

    generateMissingOffers() {
        const currentCount = GameState.offers.length;
        for (let i = currentCount; i < GameState.activeSlotsCount; i++) GameState.offers.push(this.createRandomOffer(i));
    },

    shuffleMarket() {
        if (GameState.gold >= 10) {
            GameState.gold -= 10; GameState.offers = []; this.generateMissingOffers();
            GameState.updateNetWorth(); GameState.save();
            SoundFX.playTradeClick(); this.refreshUI();
        } else {
            SoundFX.playError(); this.showToast("Not enough gold to shuffle!");
        }
    },

    tickTimers() {
        let changed = false; const now = Date.now();
        let restockedIndices = []; // Track which slots finished restocking

        GameState.offers.forEach((offer, idx) => {
            if (offer.cooldownActive) {
                const remaining = Math.ceil((offer.cooldownEndTime - now) / 1000);
                if (remaining <= 0) { 
                    GameState.offers[idx] = this.createRandomOffer(offer.id); 
                    changed = true; 
                    restockedIndices.push(idx); // Record this index
                }
                else {
                    offer.cooldownTimer = remaining;
                    const tDom = document.getElementById(`timer-txt-${offer.id}`);
                    if (tDom) tDom.innerText = `Arrives in ${remaining}s`;
                }
            }
        });

        if (changed) { 
            GameState.save(); 
            if (this.currentTab === 'market') {
                this.renderMarket(); 

                // --- FIX: TRIGGER THE FLASH-IN ANIMATION FOR RESTOCKED CARDS ---
                restockedIndices.forEach(idx => {
                    const newCard = document.querySelectorAll('.market-item')[idx];
                    if (newCard) {
                        newCard.classList.add('flash-in');
                        // Remove class after 1s so it doesn't cause loop issues
                        setTimeout(() => newCard.classList.remove('flash-in'), 1000);
                    }
                });
            } 
        }
    },

    executeTrade(idx, e) {
        const offer = GameState.offers[idx];
        
        // 1. Safety check: Don't execute if already on cooldown or invalid
        if (offer.cooldownActive) return;

        // --- FIX: VALIDATION CHECK BEFORE ANY ANIMATION PLAYS ---
        const totalCost = offer.pricePerUnit * offer.qty;
        const key = `${offer.productKey}_${offer.stars}`;

        if (offer.type === 'BUY') {
            if (GameState.gold < totalCost) { 
                SoundFX.playError(); 
                this.showToast("Insufficient gold!"); 
                return; 
            }
            if (GameState.getInventoryCount(key) + offer.qty > GameState.maxInventoryStack) { 
                SoundFX.playError(); 
                this.showToast("Warehouse full!"); 
                return; 
            }
        } else {
            if (GameState.getInventoryCount(key) < offer.qty) { 
                SoundFX.playError(); 
                this.showToast("Not enough to sell!"); 
                return; 
            }
        }

        // 2. Locate the card element
        const cardEl = e.target.closest('.market-item');
        
        // 3. Play the "Flash Out" animation
        cardEl.classList.add('flash-out');

        // 4. Wait for the animation to finish (300ms)
        setTimeout(() => {
            // --- CALL THE ACTUAL GAME LOGIC ---
            this.performTradeLogic(idx);
            
            // 5. Select the new card (which is now the cooldown card) and flash it in
            const newCard = document.querySelectorAll('.market-item')[idx];
            if (newCard) {
                newCard.classList.add('flash-in');
                setTimeout(() => newCard.classList.remove('flash-in'), 1000);
            }
        }, 100);
    },

    performTradeLogic(idx) {
        const offer = GameState.offers[idx];
        const totalCost = offer.pricePerUnit * offer.qty;
        const key = `${offer.productKey}_${offer.stars}`;

        if (offer.type === 'BUY') {
            if (GameState.gold < totalCost) { SoundFX.playError(); this.showToast("Insufficient gold!"); return; }
            if (GameState.getInventoryCount(key) + offer.qty > GameState.maxInventoryStack) { 
                SoundFX.playError(); this.showToast("Warehouse full!"); return; 
            }
            GameState.gold -= totalCost; 
            GameState.modifyInventory(key, offer.qty);
            this.displayedGold = GameState.gold; 
        } else {
            if (GameState.getInventoryCount(key) < offer.qty) { 
                SoundFX.playError(); this.showToast("Not enough to sell!"); return; 
            }
            GameState.gold += totalCost; 
            GameState.modifyInventory(key, -offer.qty);
            // Note: You might want to move spawnPhaserFlyingCoin here 
            // but remember it needs event data (e).
        }

        GameState.totalTrades++;
        offer.cooldownActive = true;
        offer.cooldownEndTime = Date.now() + (GameState.offerCooldowns * 1000);
        offer.cooldownTimer = GameState.offerCooldowns;
        
        SoundFX.playTradeClick();
        GameState.updateNetWorth(); 
        GameState.save(); 
        this.refreshUI();
    },

    // --- RENDERING ---
    renderHub() {
        document.getElementById('hub-gold').innerText = `💰 ${GameState.gold.toLocaleString()}g`;
        document.getElementById('hub-networth').innerText = `Total Assets Valuation: ${GameState.netWorth.toLocaleString()}g`;
        
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';
        const keys = Object.keys(GameState.inventory).filter(k => GameState.inventory[k] > 0);

        if (keys.length === 0) {
            grid.innerHTML = `<div style="grid-column: span 4; text-align: center; color: #e8d5a8; font-size: 13px; padding: 20px;">Your warehouse is empty!<br>Buy some produce in the markets.</div>`;
        } else {
            keys.forEach(key => {
                const parts = key.split('_'); const prod = GameState.products[parts[0]]; const stars = parts[1];
                const div = document.createElement('div');
                div.className = `inv-item ${GameState.selectedInventoryItem === key ? 'selected' : ''}`;
                
                const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];
                let starHTML = stars === 'enchanted' ? '<div class="stars enchanted">✨</div>' : (stars > 0 ? `<div class="stars ${colors[stars]}">★</div>` : '');
                
                div.innerHTML = `<div class="emoji-container"><span class="item-emoji">${prod.emoji}</span>${starHTML}</div><span class="item-qty" style="font-size: 20px;">x${GameState.inventory[key]}</span>`;
                
                div.onclick = () => { SoundFX.playClick(); GameState.selectedInventoryItem = key; this.renderHub(); };
                grid.appendChild(div);
            });
        }

        const whContainer = document.getElementById('hub-warehouse-upgrade');
        if (whContainer) {
            const maxWH = GameState.maxInventoryStack >= 999;
            const whNext = GameState.maxInventoryStack === 99 ? 199 : (GameState.maxInventoryStack === 199 ? 499 : 999);
            const whCost = GameState.maxInventoryStack === 99 ? 300 : (GameState.maxInventoryStack === 199 ? 1200 : 4500);
            whContainer.innerHTML = this.upgCardHTML("📦 Expand Warehouse", maxWH ? "Fully Upgraded" : `Max Stack Limit: ${GameState.maxInventoryStack} → ${whNext}`, maxWH, whCost, `GameApp.buyWarehouse(${whNext}, ${whCost}, event)`);
        }
        
        // Footer
        const sel = GameState.selectedInventoryItem;
        const textEl = document.getElementById('forge-selection-text');
        const btnForge = document.getElementById('btn-open-forge');
        const btnQuickSell = document.getElementById('btn-open-quicksell');
        if (GameState.getInventoryCount(sel) > 0){
            btnQuickSell.disabled = false;
        }
        if (!sel || GameState.getInventoryCount(sel) < 9) {
            btnForge.disabled = true;
            textEl.innerHTML = sel ? `Selected: ${GameState.getItemName(sel, true)}<br>Needs 9 to forge (Has: ${GameState.getInventoryCount(sel)})` : "Select an item in warehouse";
        } else {
            btnForge.disabled = false;
            textEl.innerHTML = `Selected: ${GameState.getItemName(sel, true)}<br>Available: ${GameState.getInventoryCount(sel)} / Upgradeable!`;
            btnForge.onclick = () => { SoundFX.playClick(); this.openForgeModal(sel); };
        }
        
    },

    renderMarket() {
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
                GameState.offers[idx] = this.createRandomOffer(offer.id);
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

        // --- NEW: Dynamic Upgrade Slot Placement ---
        const maxSlots = GameState.activeSlotsCount >= 6;
        if (!maxSlots) {
            const slotCost = [0, 0, 200, 600, 1800, 5000, 15000][GameState.activeSlotsCount + 1] || 999999;
            list.innerHTML += `
                <div class="market-item upgrade-slot-card" style="cursor: pointer; border: 3px dashed #bda071; background: rgba(131, 83, 44, 0.25);" onclick="GameApp.buySlot(event)">
                    <div class="market-item-icon" style="background: transparent; border: 2px dashed #bda071; font-size: 24px;">
                        ➕
                    </div>
                    <div class="market-item-info">
                        <div class="market-item-name" style="color: #fff;">🏪 Expand Market Slot</div>
                        <div style="font-size: 11px; color: #e8d5a8; font-weight: 600; margin-top: 2px;">Unlock Offer Card #${GameState.activeSlotsCount + 1}</div>
                    </div>
                    <div class="market-price-col">
                        <div class="market-item-price">${slotCost}g</div>
                    </div>
                    <button class="btn-trade buy" style="pointer-events: none;">
                        Unlock
                    </button>
                </div>`;
        }
    },

    renderUpgrades() {
        const list = document.getElementById('upgrades-list');
        list.innerHTML = '';

        
        // --- NEW: Market Tier Upgrade ---
        const tierCosts = [500, 2000, 8000, 30000, 100000];
        const isMaxTier = GameState.maxMarketTier >= 5;
        const nextTierCost = isMaxTier ? 0 : tierCosts[GameState.maxMarketTier];
        const tierDesc = isMaxTier ? "Fully Upgraded (Max Tier 5)" : `Unlock Tier ${GameState.maxMarketTier + 1} Filter & Offers`;
        list.innerHTML += this.upgCardHTML("🔍 Market Tier Limit", tierDesc, isMaxTier, nextTierCost, "GameApp.buyMarketTier(event)");

        list.innerHTML += `<div class="section-title" style="margin-top: 24px; font-size: 14px;">🍎 Unlock Produce Varieties</div>`;
        
        Object.keys(GameState.products).forEach(pKey => {
            const prod = GameState.products[pKey];
            if (prod.unlockCost > 0) {
                list.innerHTML += this.upgCardHTML(`${prod.emoji} Unlock ${prod.name}s`, prod.unlocked ? "Unlocked & active" : `Adds ${prod.name} to rotation`, prod.unlocked, prod.unlockCost, `GameApp.buyProduct('${pKey}', ${prod.unlockCost}, event)`);
            }
        });
    },

    // ==========================================
    // QUICK SELL LOGIC
    // ==========================================
    quickSellBatchCount: 1,

    getQuickSellPrice(key) {
        const parts = key.split('_');
        const prod = GameState.products[parts[0]];
        
        // If it's enchanted, halve the enchanted minimum
        if (parts[1] === 'enchanted') return Math.ceil(prod.enchMin / 2);
        
        // Otherwise, grab the standard minPrice, apply the tier multiplier, and halve it
        const tier = parseInt(parts[1]);
        const multipliers = [1.0, 1.5, 2.5, 4.0, 7.0, 15.0];
        const mult = multipliers[tier] || 1.0;
        
        return Math.ceil((prod.minPrice * mult) / 2); // Math.ceil rounds UP!
    },

    openQuickSellModal() {
        this.quickSellBatchCount = 1;
        document.getElementById('quicksell-modal').style.display = 'flex';
        this.updateQuickSellMath();
    },

    closeQuickSellModal() {
        document.getElementById('quicksell-modal').style.display = 'none';
    },

    sliderQuickSellBatch(val) {
        this.quickSellBatchCount = parseInt(val);
        this.updateQuickSellMath();
    },

    adjustQuickSellBatch(dir) {
        const max = GameState.getInventoryCount(GameState.selectedInventoryItem);
        this.quickSellBatchCount += dir;
        
        if (this.quickSellBatchCount < 1) this.quickSellBatchCount = 1;
        if (this.quickSellBatchCount > max) this.quickSellBatchCount = max;
        
        this.updateQuickSellMath();
    },

    updateQuickSellMath() {
        const key = GameState.selectedInventoryItem;
        const parts = key.split('_');
        const prod = GameState.products[parts[0]];
        const max = GameState.getInventoryCount(key);

        // Update Icons and Stars
        document.getElementById('qs-emoji').innerText = prod.emoji;
        const starsEl = document.getElementById('qs-stars');
        const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];
        
        if (parts[1] === 'enchanted') {
            starsEl.className = 'f-stars stars enchanted';
            starsEl.innerText = '✨';
        } else if (parseInt(parts[1]) > 0) {
            starsEl.className = `f-stars stars ${colors[parseInt(parts[1])]}`;
            starsEl.innerText = '★';
        } else {
            starsEl.className = 'f-stars stars';
            starsEl.innerText = '';
        }

        // Sync Slider and Text
        document.getElementById('qs-slider').max = max;
        document.getElementById('qs-slider').value = this.quickSellBatchCount;
        document.getElementById('qs-batch-count').innerText = this.quickSellBatchCount;

        // --- NEW LOGIC FOR UI ---
        
        // 1. Update the Quantity Badge on the item
        document.getElementById('qs-qty-badge').innerText = `x${this.quickSellBatchCount}`;

        // 2. Calculate price
        const pricePerUnit = this.getQuickSellPrice(key);
        const total = pricePerUnit * this.quickSellBatchCount;
        
        // 3. Update the Gold Box on the right
        document.getElementById('qs-gold-result').innerText = `${total}g`;
    },

    executeQuickSell(e) {
        const key = GameState.selectedInventoryItem;
        const max = GameState.getInventoryCount(key);
        
        if (this.quickSellBatchCount > max) return; // Failsafe

        const pricePerUnit = this.getQuickSellPrice(key);
        const total = pricePerUnit * this.quickSellBatchCount;

        // Execute transaction
        GameState.modifyInventory(key, -this.quickSellBatchCount);
        GameState.gold += total;
        GameState.save();

        SoundFX.playTradeClick();
        this.showToast(`Quick sold for ${total}g!`);
        this.spawnFloatingText(e.clientX, e.clientY, `+${total}g`, '#ffd700');
        
        // 👇 PASS total HERE AS THE THIRD ARGUMENT
        if (typeof spawnPhaserFlyingCoin === 'function' && e) {
            spawnPhaserFlyingCoin(e.clientX, e.clientY, total);
        }

        // Check if item stack is empty
        if (GameState.getInventoryCount(key) <= 0) {
            GameState.selectedInventoryItem = null;
            this.closeQuickSellModal();
        } else {
            this.adjustQuickSellBatch(0); // Reset bounds if they still have some left
        }
        
        this.refreshUI();
    },
    
    
    // ==========================================
    // UPGRADES
    // ==========================================
    buyMarketTier(e) {
        const tierCosts = [500, 2000, 8000, 30000, 100000];
        const cost = tierCosts[GameState.maxMarketTier];
        
        if (GameState.gold >= cost) {
            GameState.gold -= cost;
            GameState.maxMarketTier++;
            
            // Safety check: if filter was somehow higher, cap it
            if (GameState.marketTierFilter > GameState.maxMarketTier) {
                GameState.marketTierFilter = GameState.maxMarketTier;
            }
            
            this.onUpgSuccess(e);
            this.updateTierButtonText(); // Update the static HTML button
        } else {
            SoundFX.playError();
            this.showToast("Not enough gold!");
        }
    },

    upgCardHTML(title, desc, isMax, cost, onclickCode) {
        let btnHTML = isMax ? `<button class="btn-upg" disabled>Unlocked ✔</button>` : `<button class="btn-upg" onclick="${onclickCode}">${cost.toLocaleString()}g</button>`;
        return `
            <div class="upgrade-card wood-panel">
                <div class="upg-info"><h4>${title}</h4><p>${desc}</p></div>
                ${btnHTML}
            </div>`;
    },

    buySlot(e) {
        const cost = [0, 0, 200, 600, 1800, 5000, 15000][GameState.activeSlotsCount + 1];
        if (GameState.gold >= cost) { 
            GameState.gold -= cost; 
            GameState.activeSlotsCount++; 
            this.onUpgSuccess(e); 
            GameState.offers.push(this.createRandomOffer(GameState.activeSlotsCount-1));
            this.renderMarket();
            GameState.save();

            }
        
        else { SoundFX.playError(); this.showToast("Not enough gold!"); }
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

    // --- FORGE MODAL LOGIC ---
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

// Initialize App
window.onload = () => GameApp.init(); 