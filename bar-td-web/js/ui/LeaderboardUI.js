export class LeaderboardUI {
    constructor() {
        this.leaderboard = [];
        this.currentPage = 1;
        this.pageSize = 20;
    }
    
    async loadLeaderboard() {
        try {
            const response = await fetch(`/api/leaderboard?limit=${this.pageSize}`);
            const data = await response.json();
            
            if (data.success) {
                this.leaderboard = data.leaderboard;
                this.render();
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    }
    
    render() {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="leaderboard-header">
                <h3>🏆 Лидерборд</h3>
                <div class="leaderboard-filters">
                    <select id="leaderboard-period">
                        <option value="all">За всё время</option>
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                    </select>
                </div>
            </div>
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Игрок</th>
                        <th>Счёт</th>
                        <th>Волна</th>
                        <th>Убийства</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.leaderboard.map((entry, index) => `
                        <tr class="rank-${index + 1}">
                            <td class="rank">${this.getRankIcon(index + 1)} ${index + 1}</td>
                            <td class="username">${entry.username || `Player_${(entry.userId || '').toString().slice(0, 6)}`}</td>
                            <td class="score">${(entry.score || 0).toLocaleString()}</td>
                            <td class="wave">${entry.wave || 0}</td>
                            <td class="kills">${entry.kills || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="leaderboard-pagination">
                <button id="btn-prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>← Назад</button>
                <span>Страница ${this.currentPage}</span>
                <button id="btn-next-page">Вперёд →</button>
            </div>
        `;
        
        this.bindPaginationEvents();
    }
    
    getRankIcon(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    }
    
    bindPaginationEvents() {
        document.getElementById('btn-prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadLeaderboard();
            }
        });
        
        document.getElementById('btn-next-page')?.addEventListener('click', () => {
            if (this.currentPage * this.pageSize < this.leaderboard.length) {
                this.currentPage++;
                this.loadLeaderboard();
            }
        });
        
        document.getElementById('leaderboard-period')?.addEventListener('change', () => {
            this.loadLeaderboard();
        });
    }
}

window.LeaderboardUI = LeaderboardUI;
