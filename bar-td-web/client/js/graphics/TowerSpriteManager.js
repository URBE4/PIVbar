/**
 * TowerSpriteManager — Менеджер для загрузки и управления спрайтами башен
 * Позволяет добавлять custom спрайты и spritesheet'ы
 */

export class TowerSpriteManager {
    constructor(spriteRenderer) {
        this.renderer = spriteRenderer;
        this.loadedSprites = new Set();
    }

    /**
     * Регистрировать новый тип башни со спрайтом
     * @param {string} type - имя типа (e.g., 'pulse', 'heavy')
     * @param {Object} config - конфиг спрайта
     * @param {string} config.color - основной цвет
     * @param {number} config.width - ширина спрайта
     * @param {number} config.height - высота спрайта
     * @param {string} config.spriteSheetUrl - (опционально) URL спрайт-шита
     * @param {number} config.frameCount - количество фреймов для анимации
     */
    async registerTower(type, config) {
        // Регистрировать базовый тип
        this.renderer.registerSpriteType(type, {
            color: config.color,
            width: config.width,
            height: config.height,
            frameCount: config.frameCount || 1,
            columnsPerRow: config.columnsPerRow || 4,
            animationSpeed: config.animationSpeed || 0.1
        });

        // Если есть URL спрайт-шита, загрузить его
        if (config.spriteSheetUrl) {
            try {
                await this.renderer.loadSpriteSheet(type, config.spriteSheetUrl);
                this.loadedSprites.add(type);
                console.log(`✅ Loaded sprite sheet for tower type: ${type}`);
            } catch (error) {
                console.warn(`⚠️ Failed to load sprite sheet for ${type}:`, error);
            }
        }

        return type;
    }

    /**
     * Предзагруженные примеры башен с готовыми конфигурациями
     */
    async loadDefaultTowers() {
        const defaults = [
            {
                type: 'pulse',
                color: '#4a90d9',
                width: 40,
                height: 40,
                description: 'Быстрая стрельба, слабый урон'
            },
            {
                type: 'heavy',
                color: '#d94a4a',
                width: 50,
                height: 50,
                description: 'Мощный урон, медленная стрельба'
            },
            {
                type: 'missile',
                color: '#4ad94a',
                width: 45,
                height: 45,
                description: 'Ракеты, большой диапазон'
            },
            {
                type: 'laser',
                color: '#d9d94a',
                width: 48,
                height: 48,
                description: 'Лазер, наносит урон по времени'
            }
        ];

        return defaults;
    }

    /**
     * Загрузить спрайты из конфиг-файла (JSON)
     * @param {string} configUrl - URL JSON конфига
     */
    async loadFromConfig(configUrl) {
        try {
            const response = await fetch(configUrl);
            const config = await response.json();

            for (const towerConfig of config.towers) {
                await this.registerTower(towerConfig.type, towerConfig);
            }

            return config;
        } catch (error) {
            console.error('Failed to load sprite config:', error);
            return null;
        }
    }

    /**
     * Получить информацию о спрайте
     */
    getSpriteInfo(type) {
        const spriteData = this.renderer.getSpriteData(type);
        if (!spriteData) return null;

        return {
            type,
            width: spriteData.width,
            height: spriteData.height,
            color: spriteData.color,
            frameCount: spriteData.frameCount,
            isLoaded: this.loadedSprites.has(type)
        };
    }

    /**
     * Список всех зарегистрированных спрайтов
     */
    listRegisteredSprites() {
        const sprites = [];
        for (const [type] of this.renderer.sprites) {
            sprites.push(this.getSpriteInfo(type));
        }
        return sprites;
    }
}

export default TowerSpriteManager;
