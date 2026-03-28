export class MapRenderer {
    constructor(canvas, level) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.level = level;
        
        this.tileSize = 40;
        this.colors = {
            background: '#3d7a3d',
            path: '#d4a574',
            pathBorder: '#8b7355',
            base: '#1a4a2a',
            baseBorder: '#2d8a4a',
            towerSpot: '#1a1a2e',
            towerSpotAvailable: '#6ba3d9',
            towerSpotHover: '#5a93c9',
            obstacle: {
                mountain: '#5a5a5a',
                forest: '#2d5a2d',
                water: '#2a5a9a'
            },
            spawnPoint: '#4a1a1a',
            grid: '#ffffff'
        };
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.renderBackground();
        this.renderGrid();
        this.renderObstacles();
        this.renderPath();
        this.renderBase();
        this.renderSpawnPoints();
        this.renderTowerSpots();
    }
    
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.level.mapWidth, this.level.mapHeight);
        gradient.addColorStop(0, '#2d6a2d');
        gradient.addColorStop(0.5, '#3d8a3d');
        gradient.addColorStop(1, '#2d7a2d');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.level.mapWidth, this.level.mapHeight);
        
        // Добавляем более детальную текстуру травы
        for (let i = 0; i < this.level.mapWidth; i += 60) {
            for (let j = 0; j < this.level.mapHeight; j += 60) {
                const brightness = Math.random() * 0.1;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + brightness})`;
                this.ctx.fillRect(i, j, 40, 40);
            }
        }
        
        // Добавляем затенение для рельефа
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let i = 0; i < this.level.mapWidth; i += 80) {
            for (let j = 0; j < this.level.mapHeight; j += 80) {
                this.ctx.fillRect(i, j, 20, 20);
            }
        }
    }
    
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.level.mapWidth; x += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.level.mapHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.level.mapHeight; y += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.level.mapWidth, y);
            this.ctx.stroke();
        }
    }
    
    renderPath() {
        this.ctx.strokeStyle = this.colors.pathBorder;
        this.ctx.lineWidth = 50;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.level.enemyPath[0].x, this.level.enemyPath[0].y);
        
        for (let i = 1; i < this.level.enemyPath.length; i++) {
            this.ctx.lineTo(this.level.enemyPath[i].x, this.level.enemyPath[i].y);
        }
        
        this.ctx.stroke();
        
        // Основной цвет пути
        this.ctx.strokeStyle = this.colors.path;
        this.ctx.lineWidth = 38;
        this.ctx.stroke();
        
        // Светлая полоса по центру для объёма
        this.ctx.strokeStyle = '#e8c7a0';
        this.ctx.lineWidth = 20;
        this.ctx.stroke();
        
        this.renderPathArrows();
    }
    
    renderPathArrows() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        for (let i = 0; i < this.level.enemyPath.length - 1; i++) {
            const p1 = this.level.enemyPath[i];
            const p2 = this.level.enemyPath[i + 1];
            
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            
            this.ctx.save();
            this.ctx.translate(midX, midY);
            this.ctx.rotate(angle);
            
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.lineTo(-5, -5);
            this.ctx.lineTo(-5, 5);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    renderBase() {
        const base = this.level.basePosition;
        
        const gradient = this.ctx.createRadialGradient(
            base.x, base.y, 0,
            base.x, base.y, base.radius * 1.5
        );
        gradient.addColorStop(0, 'rgba(26, 150, 70, 0.5)');
        gradient.addColorStop(1, 'rgba(26, 150, 70, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(base.x, base.y, base.radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = this.colors.base;
        this.ctx.strokeStyle = this.colors.baseBorder;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🏰', base.x, base.y);
        
        this.renderBaseHealthBar();
    }
    
    renderBaseHealthBar() {
        const base = this.level.basePosition;
        const barWidth = 80;
        const barHeight = 8;
        const barX = base.x - barWidth / 2;
        const barY = base.y - base.radius - 20;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = base.health / base.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
        
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    renderObstacles() {
        for (const obstacle of this.level.obstacles) {
            this.ctx.fillStyle = this.colors.obstacle[obstacle.type] || '#333';
            
            switch (obstacle.type) {
                case 'mountain':
                    this.renderMountain(obstacle);
                    break;
                case 'forest':
                    this.renderForest(obstacle);
                    break;
                case 'water':
                    this.renderWater(obstacle);
                    break;
                default:
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        }
    }
    
    renderMountain(obstacle) {
        this.ctx.fillStyle = this.colors.obstacle.mountain;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width / 2 - 20, obstacle.y + 30);
        this.ctx.lineTo(obstacle.x + obstacle.width / 2 + 20, obstacle.y + 30);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderForest(obstacle) {
        this.ctx.fillStyle = this.colors.obstacle.forest;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        this.ctx.fillStyle = '#2d5a2d';
        for (let i = 0; i < 5; i++) {
            const treeX = obstacle.x + Math.random() * obstacle.width;
            const treeY = obstacle.y + Math.random() * obstacle.height;
            
            this.ctx.beginPath();
            this.ctx.arc(treeX, treeY, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderWater(obstacle) {
        this.ctx.fillStyle = this.colors.obstacle.water;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const y = obstacle.y + 20 + i * 25;
            this.ctx.beginPath();
            
            for (let x = obstacle.x; x < obstacle.x + obstacle.width; x += 10) {
                const waveY = y + Math.sin(x * 0.1) * 5;
                if (x === obstacle.x) {
                    this.ctx.moveTo(x, waveY);
                } else {
                    this.ctx.lineTo(x, waveY);
                }
            }
            
            this.ctx.stroke();
        }
    }
    
    renderSpawnPoints() {
        for (const spawn of this.level.spawnPoints) {
            const gradient = this.ctx.createRadialGradient(
                spawn.x, spawn.y, 0,
                spawn.x, spawn.y, 30
            );
            gradient.addColorStop(0, 'rgba(200, 50, 50, 0.5)');
            gradient.addColorStop(1, 'rgba(200, 50, 50, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(spawn.x, spawn.y, 30, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = this.colors.spawnPoint;
            this.ctx.strokeStyle = '#ff4444';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(spawn.x, spawn.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⚔️', spawn.x, spawn.y);
        }
    }
    
    renderTowerSpots() {
        for (const spot of this.level.towerSpots) {
            if (spot.available) {
                // Голубая точка для доступного места
                this.ctx.fillStyle = this.colors.towerSpotAvailable;
                this.ctx.strokeStyle = '#4a9fd9';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(spot.x, spot.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            } else if (spot.tower) {
                // Серая точка если башня построена
                this.ctx.fillStyle = '#3a3a5a';
                this.ctx.beginPath();
                this.ctx.arc(spot.x, spot.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    renderHoverSpot(x, y, isValid) {
        const gridX = Math.floor(x / this.tileSize) * this.tileSize + this.tileSize / 2;
        const gridY = Math.floor(y / this.tileSize) * this.tileSize + this.tileSize / 2;
        
        this.ctx.fillStyle = isValid ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        this.ctx.strokeStyle = isValid ? '#4ade80' : '#ef4444';
        this.ctx.lineWidth = 2;
        
        this.ctx.fillRect(
            gridX - this.tileSize / 2,
            gridY - this.tileSize / 2,
            this.tileSize,
            this.tileSize
        );
        this.ctx.strokeRect(
            gridX - this.tileSize / 2,
            gridY - this.tileSize / 2,
            this.tileSize,
            this.tileSize
        );
    }
    
    renderTowerRange(x, y, range) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, range, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    animatePath(time) {
        const pulse = Math.sin(time * 0.002) * 0.3 + 0.7;
        
        this.ctx.strokeStyle = `rgba(100, 150, 255, ${pulse})`;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.level.enemyPath[0].x, this.level.enemyPath[0].y);
        
        for (let i = 1; i < this.level.enemyPath.length; i++) {
            this.ctx.lineTo(this.level.enemyPath[i].x, this.level.enemyPath[i].y);
        }
        
        this.ctx.stroke();
    }
}

export default MapRenderer;
