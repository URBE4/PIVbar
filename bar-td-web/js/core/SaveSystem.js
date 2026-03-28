export class SaveSystem {
    static SAVE_KEY = 'bar_td_save';
    static SETTINGS_KEY = 'bar_td_settings';

    static saveGame(wave, resourceManager) {
        const data = {
            wave: wave,
            metal: resourceManager.metal,
            energy: resourceManager.energy,
            timestamp: Date.now(),
            stats: this.loadStats()
        };

        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        console.log('✅ Game saved');
    }

    static loadGame() {
        const saved = localStorage.getItem(this.SAVE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    static hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }

    static saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    static loadSettings() {
        const saved = localStorage.getItem(this.SETTINGS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            volume: 1.0,
            quality: 'high'
        };
    }

    static addKill() {
        const stats = this.loadStats();
        stats.kills++;
        localStorage.setItem('bar_td_stats', JSON.stringify(stats));
    }

    static addTowerBuilt() {
        const stats = this.loadStats();
        stats.towersBuilt++;
        localStorage.setItem('bar_td_stats', JSON.stringify(stats));
    }

    static loadStats() {
        const saved = localStorage.getItem('bar_td_stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            kills: 0,
            towersBuilt: 0,
            gamesWon: 0,
            gamesLost: 0
        };
    }

    static getSaveInfo() {
        const saved = this.loadGame();
        if (saved) {
            const date = new Date(saved.timestamp);
            return `Волна ${saved.wave} | ${date.toLocaleDateString()}`;
        }
        return 'Нет сохранения';
    }
}

window.SaveSystem = SaveSystem;
