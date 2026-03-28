/**
 * ПРИМЕР: Использование системы 3D спрайтов башен
 * 
 * В Game.js уже интегрирована система:
 * - TowerSpriteRenderer.js — основной рендерер
 * - TowerSpriteManager.js — менеджер спрайтов
 */

// ============================================
// 1. БАЗОВОЕ ИСПОЛЬЗОВАНИЕ (уже работает)
// ============================================
/*
Башни теперь рисуются с эффектом 3D:
- программный 3D рендеринг (без файлов изображений)
- улучшенный визус с тенями и градиентами
- поддержка анимации
- индикатор уровня башни
*/

// ============================================
// 2. ЗАГРУЗИТЬ ПОЛЬЗОВАТЕЛЬСКИЕ СПРАЙТЫ
// ============================================
/*
import { TowerSpriteManager } from './graphics/TowerSpriteManager.js';

// В Game.js после инициализации:
this.spriteManager = new TowerSpriteManager(this.towerSpriteRenderer);

// Загрузить башни с пользовательскими спрайтами:
await this.spriteManager.registerTower('pulse', {
    color: '#4a90d9',
    width: 40,
    height: 40,
    spriteSheetUrl: '/assets/towers/pulse-spritesheet.png', // (опционально)
    frameCount: 4  // если анимированный спрайт
});
*/

// ============================================
// 3. ИСПОЛЬЗОВАТЬ JSON КОНФИГ
// ============================================
/*
// Загрузить все башни из конфига:
await this.spriteManager.loadFromConfig('/assets/towers.json');

// Получить информацию о спрайте:
const pulseInfo = this.spriteManager.getSpriteInfo('pulse');
console.log(pulseInfo);

// Список всех спрайтов:
const allSprites = this.spriteManager.listRegisteredSprites();
console.log(allSprites);
*/

// ============================================
// 4. СОЗДАТЬ СОБСТВЕННЫЙ СПРАЙТ
// ============================================
/*
Пример: создать новую башню "Ice Tower"

this.spriteManager.registerTower('ice', {
    color: '#64b5f6',  // Голубой цвет
    width: 42,
    height: 42,
    frameCount: 1  // без анимации
});

// Теперь башня будет рисоваться автоматически:
const tower = new Tower(x, y, 'ice', { ... });
this.towers.push(tower);
// При render() будет использоваться спрайт 'ice' вместо дефолтного
*/

// ============================================
// 5. ЗАГРУЗИТЬ CUSTOM SPRITESHEET (PNG)
// ============================================
/*
// Если в assets/towers/ есть файл sniper-4frame.png (4x1 тайлов)
await this.spriteManager.registerTower('sniper', {
    color: '#ff6b6b',
    width: 40,
    height: 40,
    spriteSheetUrl: '/assets/towers/sniper-4frame.png',
    frameCount: 4,  // 4 фрейма анимации
    animationSpeed: 0.2
});

// Башня будет автоматически анимироваться во время игры
*/

// ============================================
// 6. СТРУКТУРА SPRITESHEET'А
// ============================================
/*
Для анимированного спрайта используется сетка 4x4 по умолчанию.
Фреймы расположены слева направо, сверху вниз.

Если у вас 4 фрейма (frameCount: 4), разместите их так:
[Frame 0] [Frame 1] [Frame 2] [Frame 3]

Все фреймы должны быть одного размера.
Размер одного фрейма = width x height в конфиге.

Пример: 4 фрейма по 40x40 = спрайт-шит 160x40 пиксели
*/

// ============================================
// 7. МЕТОДЫ РЕНДЕРИНГА
// ============================================
/*
// Рендерить башню
this.spriteRenderer.renderTower(ctx, tower);

// Показать диапазон башни
this.spriteRenderer.renderTowerRange(ctx, tower);

// Показать направление дула
const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
this.spriteRenderer.renderTowerDirection(ctx, tower, angle);

// Эффект выстрела
this.spriteRenderer.renderFireEffect(ctx, tower, target);
*/

// ============================================
// 8. ГОТОВЫЕ БАШНИ В СИСТЕМЕ
// ============================================
/*
По умолчанию зарегистрированы:
- pulse: #4a90d9 (синий, быстрый)
- heavy: #d94a4a (красный, мощный)
- missile: #4ad94a (зелёный, ракеты)
- laser: #d9d94a (жёлтый, лазер)

Каждая башня имеет 3D эффект:
- Тень\
- Градиент цвета для объёма
- Глосс (блик) на вершине
- Индикатор "готов\огонь"
*/

// ============================================
// 9. ДОБАВИТЬ СВОИ PNG СПРАЙТЫ
// ============================================
/*
1. Создайте PNG спрайт-шиты и положите в assets/towers/
   Рекомендуемые размеры: 40x40 – 50x50 пиксели за фрейм

2. Обновите assets/towers.json:
   {
     "type": "ice",
     "color": "#64b5f6",
     "width": 40,
     "height": 40,
     "spriteSheetUrl": "/assets/towers/ice-spritesheet.png",
     "frameCount": 1
   }

3. Используйте в Game.js:
   await spriteManager.loadFromConfig('/assets/towers.json');
*/

// ============================================
// ВАЖНО: Текущее состояние
// ============================================
// ✅ TowerSpriteRenderer подключена в Game.js
// ✅ Башни рисуются с 3D эффектом (программно)
// ✅ Система готова к загрузке custom спрайтов
// ✅ Выстроена архитектура для PNG spritesheet'ов

// Для загрузки PNG: создайте спрайты, положите в assets/towers/,
// и вызовите spriteManager.registerTower() с spriteSheetUrl

export const SPRITE_SYSTEM_LOADED = true;
