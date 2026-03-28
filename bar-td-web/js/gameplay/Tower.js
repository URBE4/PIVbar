import { Projectile } from './Projectile.js';

export class Tower {
    constructor(x, y, type, data) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.data = data;
        
        this.range = data.range;
        this.damage = data.damage;
        this.fireRate = data.fireRate;
        this.fireCooldown = 0;
        
        this.level = 1;
        this.target = null;
    }
    
    update(deltaTime, enemies) {
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }
        
        this.target = this.findTarget(enemies);
        
        if (this.target && this.fireCooldown <= 0) {
            this.shoot();
            this.fireCooldown = 1 / this.fireRate;
        }
    }
    
    findTarget(enemies) {
        let bestTarget = null;
        let bestScore = -Infinity;
        
        for (const enemy of enemies) {
            if (!this.canTarget(enemy)) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.range) continue;
            
            const score = enemy.pathProgress + (1000 - distance);
            
            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        }
        
        return bestTarget;
    }
    
    canTarget(enemy) {
        if (this.data.targetType === 'ground' && enemy.type === 'air') return false;
        if (this.data.targetType === 'air' && enemy.type === 'ground') return false;
        return true;
    }
    
    shoot() {
        if (!this.target) return;
        
        const projectile = new Projectile(
            this.x,
            this.y,
            this.target,
            this.damage,
            this.data.projectileSpeed,
            this.data.damageType
        );
        
        window.game.projectiles.push(projectile);
    }
    
    render(ctx) {
        ctx.fillStyle = this.data.color || '#4a90d9';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        
        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.fillStyle = '#666';
            ctx.fillRect(0, -3, 25, 6);
            ctx.restore();
        }
        
        if (this.level > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '12px Arial';
            ctx.fillText(`★${this.level}`, this.x - 10, this.y - 20);
        }
    }
    
    upgrade() {
        this.level++;
        this.damage *= 1.3;
        this.range *= 1.1;
    }
}

export const TOWER_TYPES = {
    pulse: {
        name: 'Pulse Turret',
        cost: { metal: 30, energy: 150 },
        damage: 15,
        range: 120,
        fireRate: 2.0,
        projectileSpeed: 300,
        targetType: 'all',
        damageType: 'pulse',
        color: '#4a90d9'
    },
    heavy: {
        name: 'Heavy Gun',
        cost: { metal: 50, energy: 50 },
        damage: 25,
        range: 80,
        fireRate: 1.0,
        projectileSpeed: 200,
        targetType: 'ground',
        damageType: 'impulse',
        color: '#d94a4a'
    },
    missile: {
        name: 'Missile Tower',
        cost: { metal: 120, energy: 200 },
        damage: 40,
        range: 150,
        fireRate: 1.0,
        projectileSpeed: 400,
        targetType: 'air',
        damageType: 'missile',
        color: '#4ad94a'
    },
    laser: {
        name: 'Heavy Laser',
        cost: { metal: 100, energy: 400 },
        damage: 60,
        range: 180,
        fireRate: 1.5,
        projectileSpeed: 500,
        targetType: 'all',
        damageType: 'heat',
        color: '#d9d94a'
    }
};

window.TOWER_TYPES = TOWER_TYPES;
