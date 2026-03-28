/**
 * TowerSpriteRenderer — система рендеринга 3D спрайтов башен
 * Использует pre-rendered спрайты вместо простых форм
 */

export class TowerSpriteRenderer {
    constructor() {
        this.sprites = new Map();
        this.spriteSheets = new Map();
        this.loadingPromises = [];
        this.initializeSprites();
    }

    initializeSprites() {
        // Регистрация типов башен и их спрайты
        this.registerSpriteType('pulse', {
            color: '#4a90d9',
            width: 40,
            height: 40,
            icon: '🔵'
        });

        this.registerSpriteType('heavy', {
            color: '#d94a4a',
            width: 50,
            height: 50,
            icon: '🔴'
        });

        this.registerSpriteType('missile', {
            color: '#4ad94a',
            width: 45,
            height: 45,
            icon: '🟢'
        });

        this.registerSpriteType('laser', {
            color: '#d9d94a',
            width: 48,
            height: 48,
            icon: '🟡'
        });
    }

    registerSpriteType(type, spriteData) {
        this.sprites.set(type, {
            type,
            ...spriteData,
            frameCount: spriteData.frameCount || 1,
            columnsPerRow: spriteData.columnsPerRow || 4,
            currentFrame: 0,
            animationSpeed: spriteData.animationSpeed || 0.1
        });
    }

    /**
     * Загрузить спрайт-шит из URL
     * @param {string} type - тип башни
     * @param {string} url - URL изображения
     */
    async loadSpriteSheet(type, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.spriteSheets.set(type, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));
            img.src = url;
        });
    }

    /**
     * Рендерить башню на Canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Tower} tower - объект башни
     */
    renderTower(ctx, tower) {
        if (!tower || !tower.type) return;

        const spriteData = this.sprites.get(tower.type);
        if (!spriteData) {
            this.renderFallbackTower(ctx, tower);
            return;
        }

        // Проверить, есть ли загруженный спрайт-шит
        const spriteSheet = this.spriteSheets.get(tower.type);
        if (spriteSheet) {
            this.renderFromSpriteSheet(ctx, tower, spriteData, spriteSheet);
        } else {
            this.renderProgrammaticTower(ctx, tower, spriteData);
        }
    }

    /**
     * Рендерить башню программно (без внешних изображений)
     */
    renderProgrammaticTower(ctx, tower, spriteData) {
        ctx.save();
        ctx.translate(tower.x, tower.y);

        // Базальное кольцо
        ctx.fillStyle = spriteData.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, tower.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Основная форма башни (3D эффект)
        this.drawTower3DShape(ctx, spriteData);

        // Эффект активности
        if (tower.isActive) {
            ctx.strokeStyle = spriteData.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, spriteData.width / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Уровень башни (если улучшена)
        if (tower.level && tower.level > 1) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Lv${tower.level}`, 0, spriteData.height / 2 + 10);
        }

        ctx.restore();
    }

    /**
     * Нарисовать 3D эффект башни
     */
    drawTower3DShape(ctx, spriteData) {
        const w = spriteData.width / 2;
        const h = spriteData.height / 2;

        // Тень (3D эффект)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, h + 5, w, h / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Основная башня (цилиндр с перспективой)
        const gradient = ctx.createLinearGradient(-w, -h, -w, h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, spriteData.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-w, -h / 2);
        ctx.lineTo(w, -h / 2);
        ctx.lineTo(w + 3, h / 2);
        ctx.lineTo(-w + 3, h / 2);
        ctx.closePath();
        ctx.fill();

        // Край (3D глубина)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Топ (дуло/орудие)
        ctx.fillStyle = spriteData.color;
        ctx.beginPath();
        ctx.arc(0, -h / 2, w / 3, 0, Math.PI * 2);
        ctx.fill();

        // Глосс на топе
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-w / 8, -h / 2 - 2, w / 8, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Рендерить из загруженного спрайт-шита
     */
    renderFromSpriteSheet(ctx, tower, spriteData, spriteSheet) {
        ctx.save();
        ctx.translate(tower.x, tower.y);

        // Расчет текущего фрейма на основе columnsPerRow
        const cols = spriteData.columnsPerRow || 4;
        const frameX = (spriteData.currentFrame % cols) * spriteData.width;
        const frameY = Math.floor(spriteData.currentFrame / cols) * spriteData.height;

        // Рисовать спрайт
        ctx.drawImage(
            spriteSheet,
            frameX, frameY, spriteData.width, spriteData.height,
            -spriteData.width / 2, -spriteData.height / 2,
            spriteData.width, spriteData.height
        );

        // Обновить фрейм для анимации
        spriteData.currentFrame = (spriteData.currentFrame + 1) % spriteData.frameCount;

        ctx.restore();
    }

    /**
     * Fallback рендеринг (если что-то пошло не так)
     */
    renderFallbackTower(ctx, tower) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', tower.x, tower.y);
    }

    /**
     * Рендерить диапазон башни
     */
    renderTowerRange(ctx, tower) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Рендерить эффект выстрела
     */
    renderFireEffect(ctx, tower, target) {
        ctx.save();
        ctx.strokeStyle = tower.towerData?.color || '#fff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(tower.x, tower.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Рендерить направление дула башни (ротация)
     */
    renderTowerDirection(ctx, tower, angle) {
        ctx.save();
        ctx.translate(tower.x, tower.y);
        ctx.rotate(angle);
        
        // Дуло башни
        ctx.strokeStyle = tower.towerData?.color || '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -tower.towerData?.range / 2 || -20);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Получить данные спрайта по типу
     */
    getSpriteData(type) {
        return this.sprites.get(type);
    }

    /**
     * Обновить спрайт-данные (для анимаций и эффектов)
     */
    updateSprite(type, deltaTime) {
        const sprite = this.sprites.get(type);
        if (sprite && sprite.frameCount > 1) {
            sprite.animationTime = (sprite.animationTime || 0) + deltaTime;
            if (sprite.animationTime >= sprite.animationSpeed) {
                sprite.currentFrame = (sprite.currentFrame + 1) % sprite.frameCount;
                sprite.animationTime = 0;
            }
        }
    }
}

export default TowerSpriteRenderer;
