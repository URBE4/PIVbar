/*
┌─────────────────────────────────────────────────────────────────┐
│  ⚔️                                                             │
│  │                                                              │
│  ▼                                                              │
│  ══════════╗                          ╔══════════              │
│            ▼                          ▼                        │
│         ┌──────┐                  ┌──────┐                     │
│         │🏔️   │                  │🌲   │                     │
│         │     │                  │     │                     │
│         └──────┘                  └──────┘                     │
│              ══════════════════════╗                           │
│                                    ▼                           │
│                                 ┌──────┐                       │
│                                 │💧   │                       │
│                                 │     │                       │
│                                 └──────┘                       │
│                                    │                           │
│                                    ▼                           │
│                                  🏰 BASE                       │
└─────────────────────────────────────────────────────────────────┘

⚔️ = Spawn Point
🏔️ = Mountain Obstacle
🌲 = Forest Obstacle
💧 = Water Obstacle
🏰 = Base
═══ = Enemy Path
◻️ = Tower Spots (grid)
*/

const LEVEL1_DATA = {
    id: 1,
    name: "Alpha Base",
    description: "Первая линия обороны",
    mapWidth: 1200,
    mapHeight: 800,
    enemyPath: [
        { x: 0, y: 150 },
        { x: 200, y: 150 },
        { x: 200, y: 400 },
        { x: 500, y: 400 },
        { x: 500, y: 200 },
        { x: 800, y: 200 },
        { x: 800, y: 500 },
        { x: 1000, y: 500 },
        { x: 1000, y: 400 }
    ],
    basePosition: {
        x: 1000,
        y: 400,
        radius: 60,
        health: 1000,
        maxHealth: 1000
    },
    spawnPoints: [
        { x: 0, y: 150, id: 'spawn_1' }
    ],
    obstacles: [
        { x: 300, y: 100, width: 100, height: 300, type: 'mountain' },
        { x: 600, y: 300, width: 150, height: 150, type: 'forest' },
        { x: 900, y: 600, width: 200, height: 100, type: 'water' }
    ],
    waveConfig: [
        { wave: 1, enemies: [{ type: 'scout', count: 5 }], reward: 50 },
        { wave: 2, enemies: [{ type: 'scout', count: 8 }], reward: 80 },
        { wave: 3, enemies: [{ type: 'scout', count: 10 }, { type: 'riot', count: 2 }], reward: 120 },
        { wave: 4, enemies: [{ type: 'scout', count: 12 }, { type: 'riot', count: 3 }], reward: 150 },
        { wave: 5, enemies: [{ type: 'riot', count: 8 }, { type: 'gunship', count: 2 }], reward: 200 },
        { wave: 6, enemies: [{ type: 'scout', count: 15 }, { type: 'riot', count: 5 }], reward: 250 },
        { wave: 7, enemies: [{ type: 'gunship', count: 8 }, { type: 'riot', count: 5 }], reward: 300 },
        { wave: 8, enemies: [{ type: 'riot', count: 10 }, { type: 'gunship', count: 5 }], reward: 350 },
        { wave: 9, enemies: [{ type: 'scout', count: 20 }, { type: 'riot', count: 8 }, { type: 'gunship', count: 5 }], reward: 400 },
        { wave: 10, enemies: [{ type: 'juggernaut', count: 1 }, { type: 'riot', count: 10 }], reward: 1000, isBoss: true }
    ],
    startingResources: {
        metal: 500,
        energy: 1000
    },
    baseHp: 20,
    availableTowers: ['pulse', 'heavy']
};

export class Level1 {
    constructor() {
        const config = LEVEL1_DATA;
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.mapWidth = config.mapWidth;
        this.mapHeight = config.mapHeight;
        this.enemyPath = config.enemyPath;
        this.basePosition = { ...config.basePosition };
        this.spawnPoints = config.spawnPoints;
        this.obstacles = config.obstacles;
        this.waveConfig = config.waveConfig;
        this.startingResources = config.startingResources;
        this.baseHp = config.baseHp;
        this.availableTowers = config.availableTowers;

        // Условия победы/поражения
        this.victoryCondition = {
            wavesToComplete: 10
        };

        this.defeatCondition = {
            baseHealth: 0,
            lives: 0
        };

        // Места для строительства башен (сетка 40x40)
        // ДОЛЖНО быть ПОСЛЕ инициализации this.obstacles!
        this.towerSpots = this.generateTowerSpots();
    }
    
    // Генерация мест для башен (сетка с проверками)
    generateTowerSpots() {
        const spots = [];
        const gridSize = 40;
        const minDistanceFromPath = 60;
        const minDistanceFromBase = 100;
        
        for (let x = gridSize; x < this.mapWidth - gridSize; x += gridSize) {
            for (let y = gridSize; y < this.mapHeight - gridSize; y += gridSize) {
                if (this.isValidTowerSpot({ x, y })) {
                    spots.push({
                        x: x + gridSize / 2,
                        y: y + gridSize / 2,
                        gridX: Math.floor(x / gridSize),
                        gridY: Math.floor(y / gridSize),
                        available: true,
                        tower: null
                    });
                }
            }
        }
        
        return spots;
    }
    
    // Проверка валидности места для башни
    isValidTowerSpot(position) {
        // Проверка расстояния от пути
        for (let i = 0; i < this.enemyPath.length - 1; i++) {
            const p1 = this.enemyPath[i];
            const p2 = this.enemyPath[i + 1];
            const distance = this.distanceToSegment(position, p1, p2);
            
            if (distance < 60) {
                return false;
            }
        }
        
        // Проверка расстояния от базы
        const distanceFromBase = Math.sqrt(
            Math.pow(position.x - this.basePosition.x, 2) +
            Math.pow(position.y - this.basePosition.y, 2)
        );
        
        if (distanceFromBase < this.basePosition.radius + 40) {
            return false;
        }
        
        // Проверка препятствий
        for (const obstacle of this.obstacles) {
            if (position.x > obstacle.x && 
                position.x < obstacle.x + obstacle.width &&
                position.y > obstacle.y && 
                position.y < obstacle.y + obstacle.height) {
                return false;
            }
        }
        
        return true;
    }
    
    // Расстояние от точки до отрезка
    distanceToSegment(point, segmentStart, segmentEnd) {
        const A = point.x - segmentStart.x;
        const B = point.y - segmentStart.y;
        const C = segmentEnd.x - segmentStart.x;
        const D = segmentEnd.y - segmentStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = segmentStart.x;
            yy = segmentStart.y;
        } else if (param > 1) {
            xx = segmentEnd.x;
            yy = segmentEnd.y;
        } else {
            xx = segmentStart.x + param * C;
            yy = segmentStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Получение доступных мест для строительства
    getAvailableSpots() {
        return this.towerSpots.filter(spot => spot.available);
    }
    
    // Занять место для башни
    occupySpot(gridX, gridY, tower) {
        const spot = this.towerSpots.find(
            s => s.gridX === gridX && s.gridY === gridY
        );
        
        if (spot && spot.available) {
            spot.available = false;
            spot.tower = tower;
            return true;
        }
        
        return false;
    }
    
    // Освободить место
    freeSpot(gridX, gridY) {
        const spot = this.towerSpots.find(
            s => s.gridX === gridX && s.gridY === gridY
        );
        
        if (spot) {
            spot.available = true;
            spot.tower = null;
        }
    }
    
    // Проверка, находится ли точка на пути
    isPointOnPath(x, y, tolerance = 30) {
        for (let i = 0; i < this.enemyPath.length - 1; i++) {
            const p1 = this.enemyPath[i];
            const p2 = this.enemyPath[i + 1];
            const distance = this.distanceToSegment({ x, y }, p1, p2);
            
            if (distance < tolerance) {
                return true;
            }
        }
        
        return false;
    }
    
    // Экспорт в JSON для сохранения
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            enemyPath: this.enemyPath,
            basePosition: this.basePosition,
            spawnPoints: this.spawnPoints,
            towerSpots: this.towerSpots,
            obstacles: this.obstacles,
            waveConfig: this.waveConfig,
            startingResources: this.startingResources,
            availableTowers: this.availableTowers
        };
    }
    
    // Импорт из JSON
    static fromJSON(data) {
        const level = new Level1();
        Object.assign(level, data);
        return level;
    }
}

export default Level1;
