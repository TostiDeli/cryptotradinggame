// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableClosingConfirmation();

// Get user info
const user = tg.initDataUnsafe?.user;

// Hide loading screen
setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
}, 500);

// Game State
let gameState = {
    cash: 10000,
    day: 1,
    totalTrades: 0,
    portfolio: {},
    selectedCrypto: null,
    priceHistory: [],
    achievements: {
        firstTrade: false,
        millionaire: false,
        diversified: false,
        whale: false
    },
    // Daily bonus properties
    lastBonusDate: null,
    bonusStreak: 0
};

// Cryptocurrencies
const cryptocurrencies = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: '#f7931a', price: 50000, change: 0 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: '#627eea', price: 3000, change: 0 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎', color: '#00d4aa', price: 100, change: 0 },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', icon: 'A', color: '#0033ad', price: 1.2, change: 0 },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', icon: '●', color: '#e6007a', price: 15, change: 0 }
];

// News templates
const newsTemplates = [
    { text: 'Биткоин достиг нового исторического максимума!', impact: 0.15, type: 'positive' },
    { text: 'Регуляторы ужесточают контроль над криптовалютами', impact: -0.1, type: 'negative' },
    { text: 'Крупная компания инвестировала в Ethereum', impact: 0.08, type: 'positive' },
    { text: 'Технический сбой на крупной бирже', impact: -0.05, type: 'negative' },
    { text: 'Аналитики прогнозируют бычий рынок', impact: 0.07, type: 'positive' },
    { text: 'Объем торгов достиг рекордных значений', impact: 0.05, type: 'neutral' }
];

let priceChart;

// Initialize game
function initGame() {
    cryptocurrencies.forEach(crypto => {
        gameState.portfolio[crypto.id] = 0;
        if (!gameState.priceHistory[crypto.id]) {
            gameState.priceHistory[crypto.id] = [crypto.price];
        }
    });

    loadGame();
    checkBonusOnStart();
    updateHeader();
    updateCryptoList();
    updatePortfolio();
    updateBalances();
    updateAchievements();
    addNews('Добро пожаловать в Crypto Trader!', 'neutral');

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            const section = item.dataset.section;
            document.getElementById(section + 'Section').classList.add('active');
            
            if (section === 'analytics' && gameState.selectedCrypto) {
                setTimeout(() => updateChart(), 100);
            }
            
            tg.HapticFeedback.impactOccurred('light');
        });
    });

    document.getElementById('tradeAmount').addEventListener('input', updateTradeCost);
    document.getElementById('buyBtn').addEventListener('click', buyCrypto);
    document.getElementById('sellBtn').addEventListener('click', sellCrypto);
}

// ===== DAILY BONUS FUNCTIONS =====
function checkDailyBonus() {
    const now = new Date();
    const today = now.toDateString();
    
    if (gameState.lastBonusDate !== today) {
        if (gameState.lastBonusDate) {
            const lastDate = new Date(gameState.lastBonusDate);
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
                gameState.bonusStreak = 0;
            }
        }
        return true;
    }
    return false;
}

function claimDailyBonus() {
    if (!checkDailyBonus()) {
        tg.showPopup({
            title: '❌ Бонус',
            message: 'Бонус уже получен сегодня!',
            buttons: [{ type: 'ok' }]
        });
        return;
    }
    
    const now = new Date();
    gameState.lastBonusDate = now.toDateString();
    gameState.bonusStreak++;
    
    const baseBonus = 100;
    const streakBonus = gameState.bonusStreak * 50;
    const totalBonus = baseBonus + streakBonus;
    
    gameState.cash += totalBonus;
    
    tg.showPopup({
        title: '🎁 Бонус получен!',
        message: `+$${totalBonus}\nСерия: ${gameState.bonusStreak} дней`,
        buttons: [{ type: 'ok' }]
    });
    
    tg.HapticFeedback.notificationOccurred('success');
    updateBalances();
    saveGame();
}

function checkBonusOnStart() {
    if (checkDailyBonus()) {
        tg.showPopup({
            title: '🎁 Ежедневный бонус!',
            message: `Забери бонус!\nТекущая серия: ${gameState.bonusStreak} дней`,
            buttons: [
                { id: 'claim', type: 'default', text: 'Забрать' },
                { type: 'cancel', text: 'Позже' }
            ]
        }, (buttonId) => {
            if (buttonId === 'claim') {
                claimDailyBonus();
            }
        });
    }
}
// ===== END DAILY BONUS =====

function updateHeader() {
    const header = document.getElementById('tgHeader');
    if (user) {
        header.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${user.first_name?.charAt(0) || 'U'}</div>
                <div class="user-name">${user.first_name || 'Trader'}</div>
            </div>
            <button class="next-day-btn" onclick="nextDay()" style="
                background: var(--button-color);
                color: var(--button-text-color);
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                font-weight: 600;
            ">⏭ День ${gameState.day}</button>
        `;
    } else {
        header.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">👤</div>
                <div class="user-name">Гость</div>
            </div>
            <button class="next-day-btn" onclick="nextDay()" style="
                background: var(--button-color);
                color: var(--button-text-color);
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                font-weight: 600;
            ">⏭ День ${gameState.day}</button>
        `;
    }
}

function updateCryptoList() {
    const cryptoList = document.getElementById('cryptoList');
    cryptoList.innerHTML = '';

    cryptocurrencies.forEach(crypto => {
        const changePercent = ((crypto.change || 0) * 100).toFixed(2);
        const changeClass = changePercent >= 0 ? 'positive' : 'negative';
        const changeSymbol = changePercent >= 0 ? '▲' : '▼';

        const cryptoItem = document.createElement('div');
        cryptoItem.className = `crypto-item ${gameState.selectedCrypto === crypto.id ? 'selected' : ''}`;
        cryptoItem.onclick = () => selectCrypto(crypto.id);

        cryptoItem.innerHTML = `
            <div class="crypto-info">
                <div class="crypto-icon" style="background: ${crypto.color}20; color: ${crypto.color}">${crypto.icon}</div>
                <div>
                    <div class="crypto-name">${crypto.name}</div>
                    <div class="crypto-symbol">${crypto.symbol}</div>
                </div>
            </div>
            <div class="crypto-price">
                <div class="price-value" id="price-${crypto.id}">$${formatPrice(crypto.price)}</div>
                <span class="price-change ${changeClass}">${changeSymbol} ${Math.abs(changePercent)}%</span>
            </div>
        `;

        cryptoList.appendChild(cryptoItem);
    });
}

function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    if (price >= 1) {
        return price.toFixed(2);
    }
    return price.toFixed(4);
}

function selectCrypto(cryptoId) {
    gameState.selectedCrypto = cryptoId;
    updateCryptoList();
    
    const crypto = cryptocurrencies.find(c => c.id === cryptoId);
    document.getElementById('selectedCrypto').innerHTML = `
        <div class="selected-crypto-info">
            <div class="crypto-icon" style="background: ${crypto.color}20; color: ${crypto.color};">${crypto.icon}</div>
            <div>
                <div style="font-weight: 600;">${crypto.name}</div>
                <div style="color: var(--hint-color); font-size: 14px;">${crypto.symbol} | $${formatPrice(crypto.price)}</div>
            </div>
        </div>
    `;
    
    document.getElementById('buyBtn').disabled = false;
    document.getElementById('sellBtn').disabled = false;
    updateTradeCost();
    tg.HapticFeedback.selectionChanged();
}

function updateTradeCost() {
    if (!gameState.selectedCrypto) return;

    const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    const cost = amount * crypto.price;
    const fee = cost * 0.02;

    if (amount > 0) {
        tg.MainButton.setText(`💰 Купить за $${(cost + fee).toFixed(2)}`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

function buyCrypto() {
    if (!gameState.selectedCrypto) {
        showNotification('Выберите криптовалюту!', 'error');
        return;
    }

    const amount = parseFloat(document.getElementById('tradeAmount').value);
    if (amount <= 0) {
        showNotification('Введите количество!', 'error');
        return;
    }

    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    const cost = amount * crypto.price;
    const fee = cost * 0.02;
    const total = cost + fee;

    if (total > gameState.cash) {
        showNotification('Недостаточно средств!', 'error');
        return;
    }

    gameState.cash -= total;
    gameState.portfolio[crypto.id] += amount;
    gameState.totalTrades++;

    checkAchievements();
    updatePortfolio();
    updateBalances();
    saveGame();

    showNotification(`Куплено ${amount} ${crypto.symbol}`);
    document.getElementById('tradeAmount').value = 0;
    updateTradeCost();
    tg.HapticFeedback.notificationOccurred('success');
}

function sellCrypto() {
    if (!gameState.selectedCrypto) {
        showNotification('Выберите криптовалюту!', 'error');
        return;
    }

    const amount = parseFloat(document.getElementById('tradeAmount').value);
    if (amount <= 0) {
        showNotification('Введите количество!', 'error');
        return;
    }

    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    
    if (gameState.portfolio[crypto.id] < amount) {
        showNotification('Недостаточно криптовалюты!', 'error');
        return;
    }

    const revenue = amount * crypto.price;
    const fee = revenue * 0.02;
    const total = revenue - fee;

    gameState.cash += total;
    gameState.portfolio[crypto.id] -= amount;
    gameState.totalTrades++;

    checkAchievements();
    updatePortfolio();
    updateBalances();
    saveGame();

    showNotification(`Продано ${amount} ${crypto.symbol}`);
    document.getElementById('tradeAmount').value = 0;
    updateTradeCost();
    tg.HapticFeedback.notificationOccurred('success');
}

function updatePortfolio() {
    const portfolioList = document.getElementById('portfolioList');
    portfolioList.innerHTML = '';

    let hasItems = false;

    cryptocurrencies.forEach(crypto => {
        const amount = gameState.portfolio[crypto.id];
        if (amount > 0) {
            hasItems = true;
            const value = amount * crypto.price;
            
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="crypto-icon" style="background: ${crypto.color}20; color: ${crypto.color};">${crypto.icon}</div>
                    <div>
                        <div>${crypto.symbol}</div>
                        <div style="font-weight: 600; color: var(--button-color);">${amount.toFixed(4)}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div>$${value.toFixed(2)}</div>
                    <div style="font-size: 12px; color: var(--hint-color);">$${crypto.price.toFixed(2)}</div>
                </div>
            `;
            
            portfolioList.appendChild(item);
        }
    });

    if (!hasItems) {
        portfolioList.innerHTML = '<p style="text-align: center; color: var(--hint-color); padding: 20px;">Портфель пуст</p>';
    }
}

function updateBalances() {
    let portfolioTotal = 0;
    cryptocurrencies.forEach(crypto => {
        portfolioTotal += gameState.portfolio[crypto.id] * crypto.price;
    });

    const total = gameState.cash + portfolioTotal;

    document.getElementById('cashBalance').textContent = `$${gameState.cash.toFixed(2)}`;
    document.getElementById('portfolioValue').textContent = `$${portfolioTotal.toFixed(2)}`;
    document.getElementById('totalBalance').textContent = `$${total.toFixed(2)}`;

    if (total <= 0) {
        gameOver();
    }
}

function nextDay() {
    gameState.day++;
    updateHeader();

    const news = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    
    cryptocurrencies.forEach(crypto => {
        const volatility = (Math.random() * 0.1) - 0.05;
        const change = news.impact + volatility;
        
        crypto.price = crypto.price * (1 + change);
        crypto.change = change;

        const priceElement = document.getElementById(`price-${crypto.id}`);
        if (priceElement) {
            if (change > 0) {
                priceElement.classList.add('price-up');
                setTimeout(() => priceElement.classList.remove('price-up'), 300);
            } else {
                priceElement.classList.add('price-down');
                setTimeout(() => priceElement.classList.remove('price-down'), 300);
            }
        }

        if (!gameState.priceHistory[crypto.id]) {
            gameState.priceHistory[crypto.id] = [];
        }
        gameState.priceHistory[crypto.id].push(crypto.price);
        
        if (gameState.priceHistory[crypto.id].length > 20) {
            gameState.priceHistory[crypto.id].shift();
        }
    });

    addNews(news.text, news.type);
    updateCryptoList();
    updatePortfolio();
    updateBalances();
    if (gameState.selectedCrypto) {
        updateChart();
    }
    saveGame();
    tg.HapticFeedback.impactOccurred('medium');
}

function addNews(text, type) {
    const newsFeed = document.getElementById('newsFeed');
    const newsItem = document.createElement('div');
    newsItem.className = `news-item ${type}`;
    
    const time = new Date().toLocaleTimeString();
    
    newsItem.innerHTML = `
        <div class="news-time">День ${gameState.day} | ${time}</div>
        <div>${text}</div>
    `;
    
    newsFeed.insertBefore(newsItem, newsFeed.firstChild);
    
    while (newsFeed.children.length > 10) {
        newsFeed.removeChild(newsFeed.lastChild);
    }
}

function updateChart() {
    if (!gameState.selectedCrypto) return;

    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    const history = gameState.priceHistory[crypto.id] || [crypto.price];

    const ctx = document.getElementById('priceChart').getContext('2d');

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map((_, i) => `День ${gameState.day - history.length + i + 1}`),
            datasets: [{
                label: crypto.symbol,
                data: history,
                borderColor: crypto.color,
                backgroundColor: crypto.color + '20',
                tension: 0.4,
                fill: true,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { 
                        color: '#fff',
                        callback: v => '$' + v
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

function checkAchievements() {
    const total = gameState.cash + cryptocurrencies.reduce((sum, crypto) => 
        sum + (gameState.portfolio[crypto.id] * crypto.price), 0);

    if (gameState.totalTrades >= 1 && !gameState.achievements.firstTrade) {
        gameState.achievements.firstTrade = true;
        showNotification('🏆 Первая сделка!');
        tg.HapticFeedback.notificationOccurred('success');
    }

    if (total >= 1000000 && !gameState.achievements.millionaire) {
        gameState.achievements.millionaire = true;
        showNotification('🏆 Миллионер!');
        tg.HapticFeedback.notificationOccurred('success');
    }

    const ownedCount = cryptocurrencies.filter(c => gameState.portfolio[c.id] > 0).length;
    if (ownedCount >= 3 && !gameState.achievements.diversified) {
        gameState.achievements.diversified = true;
        showNotification('🏆 Диверсификация!');
        tg.HapticFeedback.notificationOccurred('success');
    }

    updateAchievements();
}

function updateAchievements() {
    const achievementsList = document.getElementById('achievements');
    
    const achievements = [
        { id: 'firstTrade', icon: '🎯', name: 'Первая сделка', desc: 'Совершите первую сделку' },
        { id: 'millionaire', icon: '💎', name: 'Миллионер', desc: 'Капитал $1,000,000' },
        { id: 'diversified', icon: '📊', name: 'Диверсификация', desc: 'Имейте 3+ криптовалют' }
    ];

    achievementsList.innerHTML = achievements.map(ach => `
        <div class="achievement ${gameState.achievements[ach.id] ? 'unlocked' : ''}">
            <div style="font-size: 24px;">${ach.icon}</div>
            <div style="font-weight: 600;">${ach.name}</div>
            <div style="font-size: 12px; color: var(--hint-color);">${ach.desc}</div>
        </div>
    `).join('');
}

function showNotification(message, type = 'success') {
    tg.showPopup({
        title: type === 'success' ? 'Успех!' : 'Ошибка',
        message: message,
        buttons: [{ type: 'ok' }]
    });
}

function saveGame() {
    localStorage.setItem('cryptoGame', JSON.stringify({
        cash: gameState.cash,
        day: gameState.day,
        totalTrades: gameState.totalTrades,
        portfolio: gameState.portfolio,
        achievements: gameState.achievements,
        lastBonusDate: gameState.lastBonusDate,
        bonusStreak: gameState.bonusStreak
    }));
    
    if (tg.CloudStorage) {
        tg.CloudStorage.setItem('gameState', JSON.stringify(gameState));
    }
}

function loadGame() {
    const saved = localStorage.getItem('cryptoGame');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.cash = data.cash;
            gameState.day = data.day;
            gameState.totalTrades = data.totalTrades || 0;
            gameState.portfolio = data.portfolio;
            gameState.achievements = data.achievements || gameState.achievements;
            gameState.lastBonusDate = data.lastBonusDate || null;
            gameState.bonusStreak = data.bonusStreak || 0;
        } catch (e) {
            console.log('Error loading saved game');
        }
    }
}

function gameOver() {
    document.getElementById('finalDays').textContent = gameState.day;
    document.getElementById('finalBalance').textContent
