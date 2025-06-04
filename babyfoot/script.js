const storageKey = 'babyfoot-data';
const data = JSON.parse(localStorage.getItem(storageKey) || '{"players":[],"matches":[]}');

function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(data));
}

function addPlayer(name, avatar) {
    const id = Date.now().toString();
    data.players.push({ id, name, avatar, wins: 0, losses: 0, streak: 0 });
    saveData();
    renderPlayers();
    populatePlayerOptions();
}

function addMatch(team1, team2, score1, score2) {
    const match = { date: Date.now(), team1, team2, score1, score2 };
    data.matches.push(match);
    updateStats(match);
    saveData();
    renderHistory();
    renderRankings(currentRange);
    renderPlayers();
}

function updateStats(match) {
    const { team1, team2, score1, score2 } = match;
    const team1Wins = score1 > score2;
    const players1 = team1.map(id => data.players.find(p => p.id === id));
    const players2 = team2.map(id => data.players.find(p => p.id === id));
    players1.forEach(p => {
        p.wins += team1Wins ? 1 : 0;
        p.losses += team1Wins ? 0 : 1;
        p.streak = team1Wins ? p.streak + 1 : 0;
    });
    players2.forEach(p => {
        p.wins += team1Wins ? 0 : 1;
        p.losses += team1Wins ? 1 : 0;
        p.streak = team1Wins ? 0 : p.streak + 1;
    });
}

function populatePlayerOptions() {
    const selects = [p1, p2, p3, p4];
    selects.forEach(sel => {
        sel.innerHTML = '<option value="">--Choisir--</option>' +
            data.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    });
}

function renderPlayers() {
    const container = document.getElementById('players');
    container.innerHTML = '';
    data.players.forEach(p => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <img src="${p.avatar || 'https://via.placeholder.com/60'}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p>${p.wins}V / ${p.losses}D</p>
            <p>Série: ${p.streak}</p>
        `;
        container.appendChild(card);
    });
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = data.matches.slice().reverse().map(m => {
        const d = new Date(m.date).toLocaleString();
        const t1 = m.team1.map(id => getPlayerName(id)).join(' & ');
        const t2 = m.team2.map(id => getPlayerName(id)).join(' & ');
        return `<li>${d}: ${t1} ${m.score1} - ${m.score2} ${t2}</li>`;
    }).join('');
}

function getPlayerName(id) {
    const p = data.players.find(p => p.id === id);
    return p ? p.name : 'Inconnu';
}

function rangeFilter(range) {
    const now = Date.now();
    const oneDay = 86400000;
    return function(match) {
        switch(range) {
            case 'day':
                return now - match.date <= oneDay;
            case 'week':
                return now - match.date <= 7 * oneDay;
            case 'month':
                return now - match.date <= 30 * oneDay;
            default:
                return true;
        }
    };
}

function computeRankings(range) {
    const filtered = data.matches.filter(rangeFilter(range));
    const scores = {};
    filtered.forEach(m => {
        const winners = m.score1 > m.score2 ? m.team1 : m.team2;
        winners.forEach(id => {
            scores[id] = (scores[id] || 0) + 1;
        });
    });
    return Object.entries(scores).sort((a,b) => b[1]-a[1]);
}

let currentRange = 'day';
function renderRankings(range) {
    currentRange = range;
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tabs button[data-range="${range}"]`).classList.add('active');
    const rankings = computeRankings(range);
    const list = document.getElementById('ranking-list');
    list.innerHTML = rankings.map(([id, wins], idx) => {
        return `<li>#${idx+1} ${getPlayerName(id)} - ${wins} victoire(s)</li>`;
    }).join('');
}

document.getElementById('match-form').addEventListener('submit', e => {
    e.preventDefault();
    const team1 = [p1.value, p2.value];
    const team2 = [p3.value, p4.value];
    if(team1.includes('') || team2.includes('')) return;
    const score1 = parseInt(score1.value, 10);
    const score2 = parseInt(score2.value, 10);
    addMatch(team1, team2, score1, score2);
    e.target.reset();
});

document.getElementById('add-player-btn').addEventListener('click', () => {
    document.getElementById('player-modal').classList.remove('hidden');
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('player-modal').classList.add('hidden');
});

document.getElementById('player-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    if(!name) return;
    const avatar = document.getElementById('player-avatar').value.trim();
    addPlayer(name, avatar);
    e.target.reset();
    document.getElementById('player-modal').classList.add('hidden');
});

document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        renderRankings(btn.dataset.range);
    });
});

// initial render
populatePlayerOptions();
renderPlayers();
renderHistory();
renderRankings('day');
