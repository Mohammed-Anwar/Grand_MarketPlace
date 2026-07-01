/* ====================================================================
    UPGRADES MODULE
==================================================================== */
export const UpgradesController = {
    renderUpgrades(app) {
        const list = document.getElementById('upgrades-list');
        list.innerHTML = '';

        const tierCosts = [500, 2000, 8000, 30000, 100000];
        const isMaxTier = GameState.maxMarketTier >= 5;
        const nextTierCost = isMaxTier ? 0 : tierCosts[GameState.maxMarketTier];
        const tierDesc = isMaxTier ? "Fully Upgraded (Max Tier 5)" : `Unlock Tier ${GameState.maxMarketTier + 1} Filter & Offers`;
        
        // Check if player can afford the tier upgrade
        const canAffordTier = GameState.gold >= nextTierCost || isMaxTier;
        
        // Pass affordability context into your UI generator (Assuming you tweak upgCardHTML to accept it, or handle it via CSS cascading classes)
        list.innerHTML += app.upgCardHTML("🔍 Market Tier Limit", tierDesc, isMaxTier, nextTierCost, "GameApp.buyMarketTier(event)", canAffordTier);

        list.innerHTML += `<div class="section-title" style="margin-top: 24px; font-size: 14px;">🍎 Unlock Produce Varieties</div>`;
        
        Object.keys(GameState.products).forEach(pKey => {
            const prod = GameState.products[pKey];
            if (prod.unlockCost > 0) {
                const canAffordProd = GameState.gold >= prod.unlockCost || prod.unlocked;
                list.innerHTML += app.upgCardHTML(`${prod.emoji} Unlock ${prod.name}s`, prod.unlocked ? "Unlocked & active" : `Adds ${prod.name} to rotation`, prod.unlocked, prod.unlockCost, `GameApp.buyProduct('${pKey}', ${prod.unlockCost}, event)`, canAffordProd);
            }
        });
    },

    buyMarketTier(app, e) {
        const tierCosts = [500, 2000, 8000, 30000, 100000];
        const cost = tierCosts[GameState.maxMarketTier];
        
        if (GameState.gold >= cost) {
            GameState.gold -= cost;
            GameState.maxMarketTier++;
            if (GameState.marketTierFilter > GameState.maxMarketTier) {
                GameState.marketTierFilter = GameState.maxMarketTier;
            }
            app.onUpgSuccess(e);
            app.updateTierButtonText();
        } else {
            SoundFX.playError();
            app.showToast("Not enough gold!");
        }
    }
};