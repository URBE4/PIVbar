import { Level1 } from './Level1.js';

export class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.levels = {
            1: Level1
        };
        this.unlockedLevels = [1];
        this.completedLevels = [];

        this.loadProgress();
    }
    
    loadLevel(levelId) {
        if (!this.levels[levelId]) {
            console.error(`Level ${levelId} not found`);
            return null;
        }
        
        if (!this.unlockedLevels.includes(levelId)) {
            console.error(`Level ${levelId} is locked`);
            return null;
        }
        
        const LevelClass = this.levels[levelId];
        this.currentLevel = new LevelClass();
        
        console.log(`🎮 Level ${levelId} loaded: ${this.currentLevel.name}`);
        return this.currentLevel;
    }
    
    completeLevel(levelId) {
        if (!this.completedLevels.includes(levelId)) {
            this.completedLevels.push(levelId);
        }
        
        const nextLevel = levelId + 1;
        if (this.levels[nextLevel] && !this.unlockedLevels.includes(nextLevel)) {
            this.unlockedLevels.push(nextLevel);
            console.log(`🔓 Level ${nextLevel} unlocked!`);
        }
        
        this.saveProgress();
    }
    
    failLevel(levelId) {
        console.log(`❌ Level ${levelId} failed`);
    }
    
    saveProgress() {
        const progress = {
            unlockedLevels: this.unlockedLevels,
            completedLevels: this.completedLevels,
            timestamp: Date.now()
        };
        
        localStorage.setItem('bar_td_level_progress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('bar_td_level_progress');
        
        if (saved) {
            const progress = JSON.parse(saved);
            this.unlockedLevels = progress.unlockedLevels || [1];
            this.completedLevels = progress.completedLevels || [];
        }
    }
    
    isLevelUnlocked(levelId) {
        return this.unlockedLevels.includes(levelId);
    }
    
    isLevelCompleted(levelId) {
        return this.completedLevels.includes(levelId);
    }
    
    getNextLevel() {
        const maxCompleted = Math.max(...this.completedLevels, 0);
        return maxCompleted + 1;
    }
    
    registerLevel(levelId, LevelClass) {
        this.levels[levelId] = LevelClass;
    }
}

export const levelManager = new LevelManager();
export default levelManager;
