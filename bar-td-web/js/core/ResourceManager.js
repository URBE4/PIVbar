export class ResourceManager {
  constructor() {
    this.defaultMetal = 500;
    this.defaultEnergy = 1000;
    this.reset();
  }

  reset() {
    this.metal = this.defaultMetal;
    this.energy = this.defaultEnergy;
  }

  update(deltaTime) {
    // Можно добавить восстановление энергии со временем
    this.energy = Math.min(9999, this.energy + deltaTime * 2);
  }

  canAfford(metal, energy) {
    return this.metal >= metal && this.energy >= energy;
  }

  spend(metal, energy) {
    this.metal -= metal;
    this.energy -= energy;
  }

  addMetal(amount) {
    this.metal += amount;
  }

  addEnergy(amount) {
    this.energy += amount;
  }
}
