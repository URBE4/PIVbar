export class Pathfinding {
  constructor(width, height) {
    this.tileSize = 40;
    this.cols = Math.floor(width / this.tileSize);
    this.rows = Math.floor(height / this.tileSize);
    this.path = [
      { x: 0, y: 7 },
      { x: 5, y: 7 },
      { x: 5, y: 2 },
      { x: 12, y: 2 },
      { x: 12, y: 10 },
      { x: 24, y: 10 },
    ];
    this.blockedTiles = new Set();
  }

  render(ctx) {
    ctx.fillStyle = '#00b7ff22';
    ctx.strokeStyle = '#00b7ff77';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < this.path.length; i += 1) {
      const p = this.path[i];
      const x = p.x * this.tileSize + this.tileSize / 2;
      const y = p.y * this.tileSize + this.tileSize / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  getTile(x, y) {
    const tx = Math.floor(x / this.tileSize);
    const ty = Math.floor(y / this.tileSize);
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  canBuild(tile) {
    if (!tile) return false;
    const key = `${tile.x}:${tile.y}`;
    if (this.blockedTiles.has(key)) return false;

    for (const p of this.path) {
      if (Math.abs(p.x - tile.x) <= 1 && Math.abs(p.y - tile.y) <= 1) return false;
    }

    this.blockedTiles.add(key);
    return true;
  }
}
