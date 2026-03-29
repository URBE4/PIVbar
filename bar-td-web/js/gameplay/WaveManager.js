import { Enemy, ENEMY_TYPES } from './Enemy.js';

export class WaveManager {
    constructor(game) {
        this.game = game;
        this.currentWave = 0;
        this.isWaveActive = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.waveCooldown = 10;
        this.cooldownTimer = 0;
    }
    
    start() {
        this.startWave();
    }
    
    startWave() {
        this.currentWave++;
        this.isWaveActive = true;
        if (this.game.hud && this.game.hud.updateWave) this.game.hud.updateWave(this.currentWave);
        
        const waveConfig = this.getWaveConfig(this.currentWave);
        this.enemiesToSpawn = this.generateSpawns(waveConfig);
        this.spawnTimer = 0;
    }
    
    getWaveConfig(waveNumber) {
        const configs = [
            { enemies: [{ type: 'scout', count: 5 }] },
            { enemies: [{ type: 'scout', count: 10 }] },
            { enemies: [{ type: 'scout', count: 8 }, { type: 'riot', count: 2 }] },
            { enemies: [{ type: 'scout', count: 10 }, { type: 'gunship', count: 3 }] },
            { enemies: [{ type: 'riot', count: 10 }, { type: 'gunship', count: 5 }] },
            { enemies: [{ type: 'rascal', count: 15 }] },
            { enemies: [{ type: 'juggernaut', count: 1 }], isBoss: true }
        ];

        const index = Math.min(waveNumber - 1, configs.length - 1);
        return configs[index];
    }
    
    generateSpawns(config) {
        const spawns = [];
        const path = this.game.pathfinding.path || [];

        for (const enemyConfig of config.enemies) {
            const enemyTypeData = ENEMY_TYPES[enemyConfig.type];
            for (let i = 0; i < enemyConfig.count; i++) {
                spawns.push({
                    type: enemyConfig.type,
                    data: enemyTypeData,
                    path: path,
                    delay: i * 0.5
                });
            }
        }
        
        return spawns;
    }
    
    update(deltaTime) {
        if (!this.isWaveActive) {
            this.cooldownTimer -= deltaTime;
            if (this.cooldownTimer <= 0) {
                this.startWave();
            }
            return;
        }
        
        if (this.enemiesToSpawn.length === 0) {
            if (this.game.enemies.length === 0) {
                this.isWaveActive = false;
                this.cooldownTimer = this.waveCooldown;
                if (this.game.hud && this.game.hud.showNotification) {
                    this.game.hud.showNotification(`🌊 Волна ${this.currentWave} завершена!`);
                }
            }
            return;
        }
        
        this.spawnTimer += deltaTime;

        const nextSpawn = this.enemiesToSpawn[0];
        if (this.spawnTimer >= nextSpawn.delay) {
            this.spawnEnemy(nextSpawn);
            this.enemiesToSpawn.shift();
            this.spawnTimer = 0;
        }
    }
    
    spawnEnemy(spawnData) {
        const difficulty = 1 + (this.currentWave * 0.1);
        const enemy = new Enemy(
            spawnData.type,
            spawnData.data,
            spawnData.path,
            difficulty
        );
        this.game.enemies.push(enemy);
    }
}
