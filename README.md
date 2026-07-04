
# 💰 Market Place: Prototype Retrospective & Post-Mortem

**Market Place** is a game centered around buying and selling products, navigating shifting market dynamics, and maximizing your trade empire through strategic business choices and upgrades.

* **Original Godot Game (Built in 3 Days):** [Play on itch.io](https://light641.itch.io/market-place) 🎮

---

## 📖 The Evolution of the Project

I originally developed the core concept for this game during a 3-day game jam using Godot. In that initial version, the progression loop was incredibly basic. There wasn't an actual upgrade system; instead, players simply unlocked new trading cards as their wealth increased. The milestone tracking was entirely linear—every time you accumulated an additional 500 gold (1000, 1500, 2000, etc.), a new product was thrown into the rotation, and that was it.

I decided it was time to revisit, upgrade, and completely expand the concept. For this version, I chose to use **HTML5/JavaScript** instead of an engine like Godot, specifically because of how easily and rapidly you can build, iterate, and solve implementation hurdles alongside AI tools.

### 🤖 AI-Driven Prototyping: A Strategic Choice
I have a ton of ideas when it comes to systems and game mechanics, but game art is not my strong suit. Rather than wasting weeks creating high-fidelity assets for a game mechanic that might not actually pan out, I used AI to quickly build, test, and archive a playable prototype. This approach let me answer the most important question an indie developer faces before committing serious time: *Is this game actually fun to play?*

### 🛑 The Final Verdict
After building out the core mechanics and testing the loop with a fully realized progression system, I’ve made the decision to **stop development on this project**. 

To be completely honest, once the systems are all working together, the core gameplay loop just feels a bit boring to play over long sessions! As game developers, it's vital to recognize when a prototype has served its purpose so you can pivot to more exciting ideas. Even though I’m shelving this project, I still wanted to share it. Every project is a stepping stone, a lesson learned, and—like all my other games—one of my children.

---

## 🚀 New Features (Web vs. Godot)

This web prototype introduces several massive systems that completely transform the depth of the original 3-day jam game:

* **Progression-Based Unlocks:** Products are no longer handed to you automatically. Players must strategically reinvest their profits to purchase and unlock new produce varieties in the market rotation.
* **The Anvil Forge System:** Adds a crafting loop where players can combine 9 units of a standard item to forge a higher-tier, enchanted variant that commands a premium price on the market.
* **Milestone & Task Engine:** A structured objective system that guides the player through the mechanics and safely locks advanced UI buttons until the pre-requisite achievements are cleared.
* **Dynamic Anti-Softlock Storage:** To prevent players from getting permanently stuck with no money and an incompatible inventory, a low-cost baseline emergency sell mechanic was added.
* **Responsive Hybrid UI:** A fully custom layout built from scratch to seamlessly adapt between desktop monitors and mobile phone viewports.
* **Pure Web Accessibility:** Built entirely in HTML5/JS, making the prototype instantly playable on any browser, anywhere, without downloads.

---

## 🛠️ Technical Architecture & Systems Breakdown

The game runs on a lightweight, modular vanilla JavaScript framework coupled with a Phaser 3 canvas instance acting as the graphic rendering backbone.

### 1. State Management & Unified Save/Load
The entire game profile lives in a central `GameState` engine. To prevent state desynchronization (e.g., resetting your gold but keeping your unlocked tasks), everything is packed into a single JSON save block in `localStorage`:

```javascript
// Example of the unified game state save architecture
save() {
    const dataToSave = {
        gold: this.gold,
        inventory: this.inventory,
        currentTaskIndex: TaskEngine.currentTaskIndex, 
        unlockedProducts: Object.keys(this.products).reduce((acc, key) => { 
            acc[key] = this.products[key].unlocked; 
            return acc; 
        }, {}),
        offers: this.offers.map(offer => ({ ...offer }))
    };
    localStorage.setItem('grand_marketplace_save', JSON.stringify(dataToSave));
}

```

### 2. The Post-Render "State Gate"

To bypass the issues of DOM element redrawing when switching tabs or modifying panels, the game uses a centralized rendering bottleneck function (`refreshUI`). Every interaction forces a cascade that checks progression milestones *before* drawing the UI layouts, concluding with a DOM sweep that enforces features locks:

```javascript
refreshUI() {
    // Evaluate milestones before any layout updates occur
    TaskEngine.checkProgression(this);
    
    // Draw active view panels (Hub, Market, Upgrades)
    if (this.currentTab === 'market') this.renderMarket(this);

    // Enforce visibility flags across the newly generated DOM elements
    TaskEngine.enforceFeatureLocks();
}

```

### 3. Progressive Feature Locking

UI elements are structurally hidden or revealed dynamically using custom HTML5 data attributes (`data-require-task`). The lock system reads the current completed task index to gracefully toggle layouts without maintaining brittle, manual toggle code across individual modules:

```html
<!-- Unlocks dynamically once task index 1 is achieved -->
<button id="btn-market-tier" data-require-task="1" onclick="GameApp.cycleMarketTier()">
    🔍 Tier: 0/0
</button>

```

### 4. Dual-Context Toast Notification Engine

Visual messaging is split into explicit context variations (`success` vs. `error`). Standard trade issues trigger short-lived alert styles, while achieving a milestone triggers an extended green/gold achievement notification along with a direct pipeline call to explode celebration particles over the active Phaser canvas view container.

---

## 📈 Lessons Learned

* **Rapid Prototyping Saves Time:** Building this in web languages allowed for instant system iteration, confirming within days whether the mechanical design held up.
* **Decouple Data from UI:** Utilizing a central state machine made shifting from a Godot architecture to a native DOM/Phaser hybrid incredibly seamless.
* **Fail Fast, Move On:** Knowing when a game loop isn't engaging is a superpower. The systems built here will serve as modular code blocks for the next adventure!

