/* ====================================================================
    TASK & TUTORIAL ENGINE
==================================================================== */
export const TaskEngine = {
    currentTaskIndex: 0,
    
    // Definitions of milestones
    tasks: [
        { id: 0, text: "Reach 1,000 Gold", check: () => GameState.gold >= 1000, unlockFeature: "market-tier" },
        { id: 1, text: "Unlock 3 Produce Varieties", check: () => Object.values(GameState.products).filter(p => p.unlocked).length >= 3, unlockFeature: "warehouse-expansion" },
        { id: 2, text: "Accumulate a stack of 50 items", check: () => Object.values(GameState.inventory).some(qty => qty >= 50), unlockFeature: "forge" },
        { id: 3, text: "Perform your first Anvil Forge", check: () => GameState.totalCrafts >= 1, unlockFeature: "tier-filters" },
        { id: 4, text: "Complete 50 total Market trades", check: () => GameState.totalTrades >= 50, unlockFeature: "legendary-crops" }
    ],

    init() {
        // Load task index from your local storage save if available
        
    },

    getActiveTask() {
        if (this.currentTaskIndex >= this.tasks.length) return { text: "All milestones achieved! 🏆", check: () => false };
        return this.tasks[this.currentTaskIndex];
    },

    // Check if the current task condition has been met
    checkProgression(app) {
        if (this.currentTaskIndex >= this.tasks.length) return;

        const currentTask = this.tasks[this.currentTaskIndex];
        if (currentTask.check()) {
            this.currentTaskIndex++;
            
            // 🎯 SAVE DYNAMICALLY right after incrementing so progress is never lost on crash/exit
            if (window.GameState && typeof window.GameState.save === 'function') {
                window.GameState.save();
            }
            
            // Visual feedback!
            SoundFX.playUpgrade();
            app.showToast(`🎉 Milestone Completed: ${currentTask.text}`, 'success');
            app.refreshUI();
        }
    },

    // 🌟 THE SOLUTION TO YOUR REDRAW PROBLEM
    // This function sweeps the DOM and hides/shows items safely based on data-attributes
    enforceFeatureLocks() {
        const activeIndex = this.currentTaskIndex;

        document.querySelectorAll('[data-require-task]').forEach(element => {
            const requiredTaskIndex = parseInt(element.dataset.requireTask);
            
            if (activeIndex < requiredTaskIndex) {
                element.style.setProperty('display', 'none', 'important');
            } else {
                // Restore its original display layout if unlocked
                element.style.display = element.dataset.originalDisplay || '';
            }
        });
    }
};