export class ClanUI {
    constructor(networkSync) {
        this.networkSync = networkSync;
        this.currentClan = null;
        this.clanRanking = [];
    }
    
    async loadClanInfo(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`);
            const userData = await response.json();
            
            if (userData.clanId) {
                const clanResponse = await fetch(`/api/clans/${userData.clanId}`);
                const clanData = await clanResponse.json();
                
                if (clanData.success) {
                    this.currentClan = clanData.clan;
                    this.renderClanPanel();
                }
            }
        } catch (error) {
            console.error('Failed to load clan info:', error);
        }
    }
    
    async loadClanRanking() {
        try {
            const response = await fetch('/api/clans/ranking');
            const data = await response.json();
            
            if (data.success) {
                this.clanRanking = data.clans;
                this.renderClanRanking();
            }
        } catch (error) {
            console.error('Failed to load clan ranking:', error);
        }
    }
    
    renderClanPanel() {
        const panel = document.getElementById('clan-panel');
        if (!panel || !this.currentClan) return;
        
        panel.innerHTML = `
            <div class="clan-header">
                <h3>🏰 ${this.currentClan.name}</h3>
                <p class="clan-description">${this.currentClan.description || ''}</p>
            </div>
            <div class="clan-stats">
                <div class="stat">
                    <span class="label">Рейтинг:</span>
                    <span class="value">${this.currentClan.stats.totalScore}</span>
                </div>
                <div class="stat">
                    <span class="label">Побед:</span>
                    <span class="value">${this.currentClan.stats.gamesWon}</span>
                </div>
                <div class="stat">
                    <span class="label">Участников:</span>
                    <span class="value">${this.currentClan.members.length}/50</span>
                </div>
            </div>
            <div class="clan-members">
                <h4>Участники</h4>
                <ul>
                    ${this.currentClan.members.map(m => `
                        <li class="member ${m._id === this.currentClan.leaderId ? 'leader' : ''}">
                            ${m.username} ${m._id === this.currentClan.leaderId ? '👑' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="clan-actions">
                <button id="btn-leave-clan">Выйти из клана</button>
            </div>
        `;
        
        document.getElementById('btn-leave-clan')?.addEventListener('click', () => {
            this.leaveClan();
        });
    }
    
    renderClanRanking() {
        const container = document.getElementById('clan-ranking');
        if (!container) return;
        
        container.innerHTML = `
            <h3>🏆 Рейтинг кланов</h3>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Клан</th>
                        <th>Рейтинг</th>
                        <th>Победы</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.clanRanking.slice(0, 10).map((clan, index) => `
                        <tr class="${this.currentClan?._id === clan._id ? 'current' : ''}">
                            <td>${index + 1}</td>
                            <td>${clan.name}</td>
                            <td>${clan.stats.totalScore}</td>
                            <td>${clan.stats.gamesWon}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    async createClan(name, description, userId) {
        try {
            const response = await fetch('/api/clans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, userId })
            });
            
            const data = await response.json();
            if (data.success) {
                await this.loadClanInfo(userId);
                return true;
            } else {
                alert(data.error);
                return false;
            }
        } catch (error) {
            console.error('Failed to create clan:', error);
            return false;
        }
    }
    
    async joinClan(clanName, userId) {
        try {
            const response = await fetch('/api/clans/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clanName, userId })
            });
            
            const data = await response.json();
            if (data.success) {
                await this.loadClanInfo(userId);
                return true;
            } else {
                alert(data.error);
                return false;
            }
        } catch (error) {
            console.error('Failed to join clan:', error);
            return false;
        }
    }
    
    async leaveClan() {
        alert('Функция в разработке');
    }
}

window.ClanUI = ClanUI;
