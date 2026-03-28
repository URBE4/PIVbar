import { Tower } from '../gameplay/Tower.js';

export const TowerMenu = {
  game: null,
  init(game) {
    this.game = game;
    const button = document.createElement('button');
    button.textContent = 'Поставить Башню (100)';
    button.style.position = 'absolute';
    button.style.right = '20px';
    button.style.top = '20px';
    button.onclick = () => {
      if (this.game.money >= 100) {
        this.game.money -= 100;
        this.game.towers.push(new Tower(200 + Math.random() * 500, 150 + Math.random() * 250));
      }
    };
    document.body.appendChild(button);
  }
};
