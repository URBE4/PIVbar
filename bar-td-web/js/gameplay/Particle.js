export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 160;
    this.vy = (Math.random() - 0.5) * 160;
    this.life = 0.5 + Math.random() * 0.5;
    this.color = color;
  }

  update(deltaTime) {
    this.life -= deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  render(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  }
}
