/* ====================================================================
    HUB / WAREHOUSE / FORGE MODULE
==================================================================== */
export const HubController = {
    quickSellBatchCount: 1,
    forgeBatchCount: 1, // Added forge state here

    getQuickSellPrice(key) {
        const parts = key.split('_');
        const prod = GameState.products[parts[0]];
        if (parts[1] === 'enchanted') return Math.ceil(prod.enchMin / 2);
        
        const tier = parseInt(parts[1]);
        const multipliers = [1.0, 1.5, 2.5, 4.0, 7.0, 15.0];
        return Math.ceil((prod.minPrice * (multipliers[tier] || 1.0)) / 2);
    },

    renderHub(app) {
        document.getElementById('hub-gold').innerText = `💰 ${GameState.gold.toLocaleString()}g`;
        document.getElementById('hub-networth').innerText = `Total Assets Valuation: ${GameState.netWorth.toLocaleString()}g`;
        
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';
        const keys = Object.keys(GameState.inventory).filter(k => GameState.inventory[k] > 0);

        if (keys.length === 0) {
            grid.innerHTML = `<div style="grid-column: span 4; text-align: center; color: #e8d5a8; font-size: 13px; padding: 20px;">Your warehouse is empty!<br>Buy some produce in the markets.</div>`;
        } else {
            keys.forEach(key => {
                const parts = key.split('_'); 
                const prod = GameState.products[parts[0]]; 
                
                const stars = parts[1];
                const div = document.createElement('div');
                div.className = `inv-item ${GameState.selectedInventoryItem === key ? 'selected' : ''}`;
                let itemIconHTML = getPhaserSpriteHTML('food-items', prod.frameId)
                
                const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];
                let starHTML = stars === 'enchanted' ? '<div class="stars enchanted">✨</div>' : (stars > 0 ? `<div class="stars ${colors[stars]}">★</div>` : '');
                
                div.innerHTML = `<div class="emoji-container">${itemIconHTML}${starHTML}</div><span class="item-qty" style="font-size: 20px;">x${GameState.inventory[key]}</span>`;
                
                div.onclick = () => { SoundFX.playClick(); GameState.selectedInventoryItem = key; this.renderHub(app); };
                grid.appendChild(div);
            });
        }

        const whContainer = document.getElementById('hub-warehouse-upgrade');
        if (whContainer) {
            const maxWH = GameState.maxInventoryStack >= 999;
            const whNext = GameState.maxInventoryStack === 99 ? 199 : (GameState.maxInventoryStack === 199 ? 499 : 999);
            const whCost = GameState.maxInventoryStack === 99 ? 300 : (GameState.maxInventoryStack === 199 ? 1200 : 4500);
            whContainer.innerHTML = app.upgCardHTML("📦 Expand Warehouse", maxWH ? "Fully Upgraded" : `Max Stack Limit: ${GameState.maxInventoryStack} → ${whNext}`, maxWH, whCost, `GameApp.buyWarehouse(${whNext}, ${whCost}, event)`);
        }
        
        const sel = GameState.selectedInventoryItem;
        const textEl = document.getElementById('forge-selection-text');
        const btnForge = document.getElementById('btn-open-forge');
        const btnQuickSell = document.getElementById('btn-open-quicksell');
        if (GameState.getInventoryCount(sel) > 0) btnQuickSell.disabled = false;
        
        if (!sel || GameState.getInventoryCount(sel) < 9) {
            btnForge.disabled = true;
            textEl.innerHTML = sel ? `Selected: ${GameState.getItemName(sel, true)}<br>Needs 9 to forge (Has: ${GameState.getInventoryCount(sel)})` : "Select an item in warehouse";
        } else {
            btnForge.disabled = false;
            textEl.innerHTML = `Selected: ${GameState.getItemName(sel, true)}<br>Available: ${GameState.getInventoryCount(sel)} / Upgradeable!`;
            // Redirected setup directly to this controller
            btnForge.onclick = () => { SoundFX.playClick(); this.openForgeModal(sel); };
        }
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

        document.getElementById('qs-emoji').innerHTML = getPhaserSpriteHTML('food-items', prod.frameId);
        const starsEl = document.getElementById('qs-stars');
        const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];
        
        if (parts[1] === 'enchanted') {
            starsEl.className = 'f-stars stars enchanted'; starsEl.innerText = '✨';
        } else if (parseInt(parts[1]) > 0) {
            starsEl.className = `f-stars stars ${colors[parseInt(parts[1])]}`; starsEl.innerText = '★';
        } else {
            starsEl.className = 'f-stars stars'; starsEl.innerText = '';
        }

        document.getElementById('qs-slider').max = max;
        document.getElementById('qs-slider').value = this.quickSellBatchCount;
        document.getElementById('qs-batch-count').innerText = this.quickSellBatchCount;
        document.getElementById('qs-qty-badge').innerText = `x${this.quickSellBatchCount}`;

        const pricePerUnit = this.getQuickSellPrice(key);
        document.getElementById('qs-gold-result').innerText = `${pricePerUnit * this.quickSellBatchCount}g`;
    },

    executeQuickSell(app, e) {
        const key = GameState.selectedInventoryItem;
        const max = GameState.getInventoryCount(key);
        if (this.quickSellBatchCount > max) return;

        const pricePerUnit = this.getQuickSellPrice(key);
        const total = pricePerUnit * this.quickSellBatchCount;

        GameState.modifyInventory(key, -this.quickSellBatchCount);
        GameState.gold += total;
        GameState.save();

        SoundFX.playTradeClick();
        app.showToast(`Quick sold for ${total}g!`);
        app.spawnFloatingText(e.clientX, e.clientY, `+${total}g`, '#ffd700');
        
        if (typeof spawnPhaserFlyingCoin === 'function' && e) {
            spawnPhaserFlyingCoin(e.clientX, e.clientY, total);
        }

        if (GameState.getInventoryCount(key) <= 0) {
            GameState.selectedInventoryItem = null;
            this.closeQuickSellModal();
        } else {
            this.adjustQuickSellBatch(0);
        }
        app.refreshUI();
    },

    openForgeModal(key) {
        this.forgeBatchCount = 1;
        const parts = key.split('_'); const pKey = parts[0]; const stars = parts[1];
        const prod = GameState.products[pKey];
        const nextStars = stars === '5' ? 'enchanted' : (parseInt(stars) + 1).toString();
        const colors = ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];

        document.getElementById('f-src-emoji').innerHTML = getPhaserSpriteHTML('food-items', prod.frameId);
        document.getElementById('f-src-stars').innerHTML = stars === 'enchanted' ? '✨' : (stars > 0 ? '★' : '');
        document.getElementById('f-src-stars').className = `f-stars stars ${stars === 'enchanted' ? 'enchanted' : (colors[stars] || '')}`;

        document.getElementById('f-dst-emoji').innerHTML = getPhaserSpriteHTML('food-items', prod.frameId);
        document.getElementById('f-dst-stars').innerHTML = nextStars === 'enchanted' ? '✨' : '★';
        document.getElementById('f-dst-stars').className = `f-stars stars ${nextStars === 'enchanted' ? 'enchanted' : colors[nextStars]}`;

        this.updateForgeMath(key, prod, nextStars);
        document.getElementById('forge-modal').style.display = 'flex';
    },

    closeForgeModal() { 
        document.getElementById('forge-modal').style.display = 'none'; 
    },

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

    executeForge(app, e) {
        const key = GameState.selectedInventoryItem;
        const parts = key.split('_'); const destKey = `${parts[0]}_${parts[1] === '5' ? 'enchanted' : (parseInt(parts[1]) + 1).toString()}`;
        if (GameState.getInventoryCount(destKey) + this.forgeBatchCount > GameState.maxInventoryStack) { SoundFX.playError(); app.showToast("Destination stack full!"); return; }

        GameState.modifyInventory(key, -(this.forgeBatchCount * 9));
        GameState.modifyInventory(destKey, this.forgeBatchCount);
        GameState.totalCrafts++;
        if (GameState.getInventoryCount(key) <= 0) GameState.selectedInventoryItem = null;
        
        app.triggerForgeExplosion(); SoundFX.playForge();
        GameState.save(); this.closeForgeModal(); app.refreshUI();
    }
};