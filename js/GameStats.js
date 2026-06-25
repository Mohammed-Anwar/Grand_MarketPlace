
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
    offerCooldowns: 5, // 10 seconds cooldown for each offer after a trade
    totalTrades: 0,
    totalCrafts: 0,
    netWorth: 50,
    offers: [],
    products: {
        // --- 🍏 APPLE: The High-Volume Bulk Staple ---
        // Personality: Tiny margins per unit, but traded in huge crates. Highly predictable and common.
        apple: { 
            name: "Apple", 
            emoji: "🍎", 
            unlocked: true, 
            unlockCost: 0,
            minPrice: 3, maxPrice: 9, 
            enchMin: 500, enchMax: 1000,
            minBatch: 20, maxBatch: 50,        // Spawns in massive quantities!
            tierMultiplier: 1.5,  // Standard tier scaling
            spawnWeight: 100,     // Super common in market slots
            priceSkew: 1.0,       // Perfectly even linear price distribution
            forgeCostRatio: 9     // Takes 9 pieces to forge
        },

        // --- 🍓 BERRY: The Volatile High-Risk Gamble ---
        // Personality: Massive price range variance. Extremely cheap floor, massive jackpot ceiling. 
        berry: { 
            name: "Berry", 
            emoji: "🍌", 
            unlocked: false, 
            unlockCost: 150,
            minPrice: 4, maxPrice: 35,         // Huge spread percentage-wise
            enchMin: 1200, enchMax: 2400,
            minBatch: 4, maxBatch: 12,
            tierMultiplier: 2.1,  // High payout if you successfully forge a cheap berry
            spawnWeight: 65,      // Common
            priceSkew: 0.6,       // Tends to sit dirt-cheap most of the time; max-price payouts are rare spikes
            forgeCostRatio: 6     // Easier to forge up!
        },

        // --- 🍐 PEAR: The Steady Premium Asset ---
        // Personality: Tight price margins but a very high price floor. Safe place to park your gold.
        pear: { 
            name: "Pear", 
            emoji: "🍐", 
            unlocked: false, 
            unlockCost: 500,
            minPrice: 30, maxPrice: 50,         // Safe, low-risk tight margins
            enchMin: 3000, enchMax: 6000,
            minBatch: 8, maxBatch: 20,
            tierMultiplier: 1.6,  
            spawnWeight: 45,      // Moderate spawn rate
            priceSkew: 1.1,       // Naturally skews slightly towards the more expensive side
            forgeCostRatio: 9     
        },

        // --- 🍇 GRAPE: The Crafting Special (Artisan Crop) ---
        // Personality: Terrible to sell raw at Tier 0, but scales exponentially when forged.
        grape: { 
            name: "Grape", 
            emoji: "🍇", 
            unlocked: false, 
            unlockCost: 1800,
            minPrice: 65, maxPrice: 130, 
            enchMin: 8000, enchMax: 15000,
            minBatch: 3, maxBatch: 10,
            tierMultiplier: 2.5,  // Legendary return-on-investment when forged to higher stars
            spawnWeight: 25,      // Rare
            priceSkew: 0.9,       
            forgeCostRatio: 5     // Highly appealing to forge—only takes 5 items instead of 9!
        },

        // --- 🎃 PUMPKIN: The Heavyweight Crop ---
        // Personality: Slow-moving, heavy asset. Massive bulk order sizes, but requires a lot of materials to refine.
        pumpkin: { 
            name: "Pumpkin", 
            emoji: "🎃", 
            unlocked: false, 
            unlockCost: 6000,
            minPrice: 160, maxPrice: 320, 
            enchMin: 20000, enchMax: 40000,
            minBatch: 12, maxBatch: 28,         // Massive payout requirements when a trade shows up
            tierMultiplier: 1.7,  
            spawnWeight: 12,      // Very Rare
            priceSkew: 1.0,       
            forgeCostRatio: 12    // Heavy and dense—takes 12 items to forge to the next star
        },

        // --- 🐉 DRAGONFRUIT: The Legendary Whale Asset ---
        // Personality: Hyper-expensive, ultra-rare status symbol crop. High entry barrier, tiny quantities.
        dragonfruit: { 
            name: "Dragonfruit", 
            emoji: "🐉", 
            unlocked: false, 
            unlockCost: 20000,
            minPrice: 450, maxPrice: 950, 
            enchMin: 55000, enchMax: 99999,
            minBatch: 1, maxBatch: 4,          // Traded in boutique numbers
            tierMultiplier: 1.9,  
            spawnWeight: 4,       // Ultra Rare event asset
            priceSkew: 1.4,       // Incredibly greedy merchants—usually spawns listed at high prices
            forgeCostRatio: 9     
        }
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