export class Projectile {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = 300;
    this.dead = false;
  }

  update(dt, game) {
    if (!this.target || this.target.dead) {
      this.dead = true;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 5) {
      this.target.hurt(this.damage, game);
      this.dead = true;
      return;
    }
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  }

  draw(ctx) {
    ctx.fillStyle = '#ffba08';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
