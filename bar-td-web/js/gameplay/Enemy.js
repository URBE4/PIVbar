export class Enemy {
    constructor(type, data, path, difficultyMultiplier = 1) {
        this.type = type;
        this.data = data;
        this.path = path;
        
        this.maxHealth = data.health * difficultyMultiplier;
        this.health = this.maxHealth;
        this.speed = data.speed;
        this.reward = data.reward;
        
        this.pathIndex = 0;
        this.pathProgress = 0;
        this.reachedBase = false;
        
        this.x = path[0].x;
        this.y = path[0].y;
        
        this.frozen = 0;
        this.burned = 0;
    }
    
    update(deltaTime) {
        if (this.frozen > 0) {
            this.frozen -= deltaTime;
        }
        
        const currentSpeed = this.frozen > 0 ? this.speed * 0.5 : this.speed;
        
        const target = this.path[this.pathIndex + 1];
        if (!target) {
            this.reachedBase = true;
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            this.pathIndex++;
            this.pathProgress = (this.pathIndex / this.path.length) * 100;
        } else {
            this.x += (dx / distance) * currentSpeed * deltaTime;
            this.y += (dy / distance) * currentSpeed * deltaTime;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    render(ctx) {
        ctx.fillStyle = this.data.color || '#e94560';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        const barWidth = 30;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth / 2, this.y - 20, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : '#ef4444';
        ctx.fillRect(this.x - barWidth / 2, this.y - 20, barWidth * healthPercent, barHeight);
        
        if (this.data.type === 'air') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 15, this.y - 15);
            ctx.lineTo(this.x + 15, this.y + 15);
            ctx.moveTo(this.x + 15, this.y - 15);
            ctx.lineTo(this.x - 15, this.y + 15);
            ctx.stroke();
        }
    }
}

export const ENEMY_TYPES = {
    scout: {
        name: 'Scout',
        health: 30,
        speed: 100,
        reward: 5,
        type: 'ground',
        color: '#e94560'
    },
    riot: {
        name: 'Riot',
        health: 150,
        speed: 50,
        reward: 15,
        type: 'ground',
        color: '#a33'
    },
    gunship: {
        name: 'Gunship',
        health: 80,
        speed: 80,
        reward: 10,
        type: 'air',
        color: '#63e'
    },
    juggernaut: {
        name: 'Juggernaut',
        health: 2000,
        speed: 30,
        reward: 500,
        type: 'ground',
        color: '#f00'
    },
    rascal: {
        name: 'Rascal',
        health: 25,
        speed: 120,
        reward: 8,
        type: 'ground',
        color: '#ff9500'
    }
};

window.ENEMY_TYPES = ENEMY_TYPES;
