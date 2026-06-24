
/* ====================================================================
    GAME STATE & LOGIC
==================================================================== */
const GameState = {
    gold: 500,
    soundEnabled: true,
    marketTierFilter: 0, // Current filter selection (0 to 5)
    maxMarketTier: 0,    // Maximum unlocked tier (0 to 5)
    activeSlotsCount: 1, 
    maxInventoryStack: 99, 
    selectedInventoryItem: null, 
    totalTrades: 0,
    totalCrafts: 0,
    netWorth: 50,
    offers: [],
    products: {
        apple: { name: "Apple", emoji: "🍎", unlocked: true, minPrice: 4, maxPrice: 8, enchMin: 500, enchMax: 1000, unlockCost: 0 },
        berry: { name: "Berry", emoji: "🍌", unlocked: false, minPrice: 10, maxPrice: 20, enchMin: 1200, enchMax: 2400, unlockCost: 150 },
        pear: { name: "Pear", emoji: "🍐", unlocked: false, minPrice: 25, maxPrice: 50, enchMin: 3000, enchMax: 6000, unlockCost: 500 },
        grape: { name: "Grape", emoji: "🍇", unlocked: false, minPrice: 65, maxPrice: 130, enchMin: 8000, enchMax: 15000, unlockCost: 1800 },
        pumpkin: { name: "Pumpkin", emoji: "🎃", unlocked: false, minPrice: 160, maxPrice: 320, enchMin: 20000, enchMax: 40000, unlockCost: 6000 },
        dragonfruit: { name: "Dragonfruit", emoji: "🐉", unlocked: false, minPrice: 420, maxPrice: 850, enchMin: 55000, enchMax: 99999, unlockCost: 20000 }
    },
    inventory: { 'apple_0': 15 },

    save() {
        const dataToSave = {
            gold: this.gold, soundEnabled: this.soundEnabled, activeSlotsCount: this.activeSlotsCount, maxInventoryStack: this.maxInventoryStack,
            totalTrades: this.totalTrades, totalCrafts: this.totalCrafts, inventory: this.inventory,
            marketTierFilter: this.marketTierFilter,
            maxMarketTier: this.maxMarketTier,
            unlockedProducts: Object.keys(this.products).reduce((acc, key) => { acc[key] = this.products[key].unlocked; return acc; }, {}),
            offers: this.offers.map(offer => ({
                id: offer.id, type: offer.type, productKey: offer.productKey, stars: offer.stars, pricePerUnit: offer.pricePerUnit, qty: offer.qty,
                cooldownActive: offer.cooldownActive, cooldownEndTime: offer.cooldownEndTime || 0
            }))
        };
        localStorage.setItem('grand_marketplace_save', JSON.stringify(dataToSave));
    },

    load() {
        const savedData = localStorage.getItem('grand_marketplace_save');
        if (!savedData) return false;
        try {
            const data = JSON.parse(savedData);
            if (data.gold !== undefined) this.gold = data.gold;
            if (data.soundEnabled !== undefined) this.soundEnabled = data.soundEnabled;
            if (data.activeSlotsCount !== undefined) this.activeSlotsCount = data.activeSlotsCount;
            if (data.maxInventoryStack !== undefined) this.maxInventoryStack = data.maxInventoryStack;
            if (data.totalTrades !== undefined) this.totalTrades = data.totalTrades;
            if (data.totalCrafts !== undefined) this.totalCrafts = data.totalCrafts;
            if (data.inventory !== undefined) this.inventory = data.inventory;
            if (data.marketTierFilter !== undefined) this.marketTierFilter = data.marketTierFilter;
            if (data.maxMarketTier !== undefined) this.maxMarketTier = data.maxMarketTier;

            if (data.unlockedProducts) {
                for (let key in data.unlockedProducts) if (this.products[key]) this.products[key].unlocked = data.unlockedProducts[key];
            }

            if (data.offers) {
                const now = Date.now();
                this.offers = data.offers.map(offer => {
                    let timer = 0; let active = offer.cooldownActive;
                    if (active && offer.cooldownEndTime) {
                        const remaining = Math.ceil((offer.cooldownEndTime - now) / 1000);
                        if (remaining <= 0) active = false; else timer = remaining;
                    }
                    return { ...offer, cooldownActive: active, cooldownTimer: timer };
                });
            }
            this.updateNetWorth(); return true;
        } catch (e) { return false; }
    },

    getItemName(key, asHTML = false) {
        const parts = key.split('_'); const prod = this.products[parts[0]];
        if (!prod) return "Unknown";
        if (parts[1] === '0') return prod.name;
        if (parts[1] === 'enchanted') {
            return asHTML ? `${prod.name} <span style="color:#e85d3a; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">✨</span>` : `Enchanted ${prod.name} ✨`;
        }
        const colors = ['', '#a0a0a0', '#cd7f32', '#e3e4e5', '#ffd700', '#9b4aff'];
        const color = colors[parseInt(parts[1])];
        return asHTML ? `${prod.name} <span style="color:${color}; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">★</span>` : `${prod.name} (Tier ${parts[1]})`;
    },

    hasEnchantedItem() {
        return Object.keys(this.inventory).some(k => k.endsWith('_enchanted') && this.inventory[k] > 0);
    },

    getInventoryCount(key) { return this.inventory[key] || 0; },

    modifyInventory(key, amount) {
        if (!this.inventory[key]) this.inventory[key] = 0;
        this.inventory[key] += amount;
        if (this.inventory[key] <= 0) delete this.inventory[key];
        else if (this.inventory[key] > this.maxInventoryStack) this.inventory[key] = this.maxInventoryStack;
        this.updateNetWorth();
        this.save();
    },

    updateNetWorth() {
        let val = this.gold;
        for (let key in this.inventory) {
            const count = this.inventory[key];
            if (count <= 0) continue;
            const parts = key.split('_'); const prod = this.products[parts[0]];
            if (!prod) continue;
            let basePrice = (prod.minPrice + prod.maxPrice) / 2;
            if (parts[1] === 'enchanted') basePrice = (prod.enchMin + prod.enchMax) / 2;
            else basePrice = basePrice * Math.pow(11, parseInt(parts[1]));
            val += Math.round(basePrice * count);
        }
        this.netWorth = val;
    }
};