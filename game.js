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
    bestDay: 0,
    portfolio: {},
    selectedCrypto: null,
    priceHistory: [],
    achievements: {
        firstTrade: false,
        millionaire: false,
        diversified: false,
        whale: false
    }
};

// Cryptocurrencies
const cryptocurrencies = [
    { 
        id: 'bitcoin', 
        name: 'Bitcoin', 
        symbol: 'BTC', 
        icon: '₿', 
        color: '#f7931a', 
        price: 50000, 
        change: 0,
        description: 'Первая криптовалюта',
        marketCap: 'Крупнейший',
        volume: 'Высокий'
    },
    { 
        id: 'ethereum', 
        name: 'Ethereum', 
        symbol: 'ETH', 
        icon: 'Ξ', 
        color: '#627eea', 
        price: 3000, 
        change: 0,
        description: 'Смарт-контракты',
        marketCap: 'Второй',
        volume: 'Высокий'
    },
    { 
        id: 'solana', 
        name: 'Solana', 
        symbol: 'SOL', 
        icon: '◎', 
        color: '#00d4aa', 
        price: 100, 
        change: 0,
        description: 'Быстрая сеть',
        marketCap: 'Средний',
        volume: 'Средний'
    }
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
// Продолжение списка криптовалют
const moreCryptocurrencies = [
    { 
        id: 'cardano', 
        name: 'Cardano', 
        symbol: 'ADA', 
        icon: 'A', 
        color: '#0033ad', 
        price: 1.2, 
        change: 0,
        description: 'Научный подход',
        marketCap: 'Средний',
        volume: 'Средний'
    },
    { 
        id: 'polkadot', 
        name: 'Polkadot', 
        symbol: 'DOT', 
        icon: '●', 
        color: '#e6007a', 
        price: 15, 
        change: 0,
        description: 'Мультичейн',
        marketCap: 'Средний',
        volume: 'Средний'
    },
    { 
        id: 'binance', 
        name: 'Binance Coin', 
        symbol: 'BNB', 
        icon: '🪙', 
        color: '#f3ba2f', 
        price: 400, 
        change: 0,
        description: 'Биржевой токен',
        marketCap: 'Крупный',
        volume: 'Высокий'
    },
    { 
        id: 'ripple', 
        name: 'Ripple', 
        symbol: 'XRP', 
        icon: '💧', 
        color: '#23292f', 
        price: 0.8, 
        change: 0,
        description: 'Для банков',
        marketCap: 'Средний',
        volume: 'Средний'
    },
    { 
        id: 'dogecoin', 
        name: 'Dogecoin', 
        symbol: 'DOGE', 
        icon: '🐕', 
        color: '#c2a633', 
        price: 0.12, 
        change: 0,
        description: 'Мем-койн',
        marketCap: 'Средний',
        volume: 'Высокий'
    }
];

// Объединяем массивы
cryptocurrencies.push(...moreCryptocurrencies);

// Initialize game
function initGame() {
    cryptocurrencies.forEach(crypto => {
        gameState.portfolio[crypto.id] = 0;
        if (!gameState.priceHistory[crypto.id]) {
            gameState.priceHistory[crypto.id] = [crypto.price];
        }
    });

    loadGame();
    updateHeader();
    updateCryptoList();
    updateCryptoCatalog();
    updatePortfolio();
    updateBalances();
    updateAchievements();
    updateProfile();
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
// НОВАЯ ФУНКЦИЯ: Каталог криптовалют
function updateCryptoCatalog() {
    const catalog = document.getElementById('cryptoCatalog');
    if (!catalog) return;
    
    catalog.innerHTML = cryptocurrencies.map(crypto => `
        <div class="catalog-item" onclick="quickBuy('${crypto.id}')">
            <div class="catalog-icon" style="color: ${crypto.color}">${crypto.icon}</div>
            <div class="catalog-name">${crypto.name}</div>
            <div class="catalog-symbol">${crypto.symbol}</div>
            <div class="catalog-price">$${formatPrice(crypto.price)}</div>
            <div class="catalog-description" style="font-size: 12px; color: var(--hint-color); margin-bottom: 10px;">
                ${crypto.description}
            </div>
            <button class="catalog-btn" onclick="event.stopPropagation(); quickBuy('${crypto.id}')">
                Купить
            </button>
        </div>
    `).join('');
}

// НОВАЯ ФУНКЦИЯ: Быстрая покупка из каталога
function quickBuy(cryptoId) {
    const crypto = cryptocurrencies.find(c => c.id === cryptoId);
    const amount = 1;
    
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
    
    const currentTotal = gameState.cash + calculatePortfolioValue();
    if (currentTotal > gameState.bestDay) {
        gameState.bestDay = currentTotal;
    }
    
    checkAchievements();
    updatePortfolio();
    updateBalances();
    updateProfile();
    saveGame();
    
    showNotification(`Куплен ${crypto.symbol}`);
    tg.HapticFeedback.notificationOccurred('success');
}

// НОВАЯ ФУНКЦИЯ: Обновление профиля
function updateProfile() {
    const avatar = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const levelEl = document.getElementById('profileLevel');
    
    if (user) {
        nameEl.textContent = user.first_name || 'Игрок';
        avatar.textContent = user.first_name?.charAt(0) || '👤';
    }
    
    const total = gameState.cash + calculatePortfolioValue();
    let level = 'Новичок';
    if (total >= 1000000) level = 'Легенда 👑';
    else if (total >= 500000) level = 'Магнат 💎';
    else if (total >= 100000) level = 'Профи ⚡';
    else if (total >= 50000) level = 'Трейдер 📊';
    levelEl.textContent = level;
    
    document.getElementById('statTrades').textContent = gameState.totalTrades;
    document.getElementById('statBestDay').textContent = `$${gameState.bestDay.toFixed(2)}`;
    document.getElementById('statDays').textContent = gameState.day;
    
    const rareCoins = cryptocurrencies.filter(c => 
        gameState.portfolio[c.id] > 0 && c.price > 1000
    ).length;
    document.getElementById('statRare').textContent = rareCoins;
    
    updateProfileAchievements();
}

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
    
    const currentTotal = gameState.cash + calculatePortfolioValue();
    if (currentTotal > gameState.bestDay) {
        gameState.bestDay = currentTotal;
    }

    checkAchievements();
    updatePortfolio();
    updateBalances();
    updateProfile();
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
    
    const currentTotal = gameState.cash + calculatePortfolioValue();
    if (currentTotal > gameState.bestDay) {
        gameState.bestDay = currentTotal;
    }

    checkAchievements();
    updatePortfolio();
    updateBalances();
    updateProfile();
    saveGame();

    showNotification(`Продано ${amount} ${crypto.symbol}`);
    document.getElementById('tradeAmount').value = 0;
    updateTradeCost();
    tg.HapticFeedback.notificationOccurred('success');
}

function calculatePortfolioValue() {
    let total = 0;
    cryptocurrencies.forEach(crypto => {
        total += gameState.portfolio[crypto.id] * crypto.price;
    });
    return total;
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
    const portfolioTotal = calculatePortfolioValue();
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
    updateCryptoCatalog();
    updatePortfolio();
    updateBalances();
    updateProfile();
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
    const total = gameState.cash + calculatePortfolioValue();

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
    
    if (gameState.portfolio.bitcoin >= 10 && !gameState.achievements.whale) {
        gameState.achievements.whale = true;
        showNotification('🏆 Кит!');
        tg.HapticFeedback.notificationOccurred('success');
    }

    updateAchievements();
    updateProfileAchievements();
}

function updateAchievements() {
    const achievementsList = document.getElementById('achievements');
    if (!achievementsList) return;
    
    const achievements = [
        { id: 'firstTrade', icon: '🎯', name: 'Первая сделка', desc: 'Совершите первую сделку' },
        { id: 'millionaire', icon: '💎', name: 'Миллионер', desc: 'Капитал $1,000,000' },
        { id: 'diversified', icon: '📊', name: 'Диверсификация', desc: 'Имейте 3+ криптовалют' },
        { id: 'whale', icon: '🐋', name: 'Кит', desc: 'Имейте 10+ Bitcoin' }
    ];

    achievementsList.innerHTML = achievements.map(ach => `
        <div class="achievement ${gameState.achievements[ach.id] ? 'unlocked' : ''}">
            <div style="font-size: 24px;">${ach.icon}</div>
            <div style="font-weight: 600;">${ach.name}</div>
            <div style="font-size: 12px; color: var(--hint-color);">${ach.desc}</div>
        </div>
    `).join('');
}

function updateProfileAchievements() {
    const achievementsList = document.getElementById('profileAchievements');
    if (!achievementsList) return;
    
    const achievements = [
        { id: 'firstTrade', icon: '🎯', name: 'Первая сделка', desc: 'Совершите первую сделку' },
        { id: 'millionaire', icon: '💎', name: 'Миллионер', desc: 'Капитал $1,000,000' },
        { id: 'diversified', icon: '📊', name: 'Диверсификация', desc: 'Имейте 3+ криптовалют' },
        { id: 'whale', icon: '🐋', name: 'Кит', desc: 'Имейте 10+ Bitcoin' }
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
        bestDay: gameState.bestDay,
        portfolio: gameState.portfolio,
        achievements: gameState.achievements
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
            gameState.bestDay = data.bestDay || 0;
            gameState.portfolio = data.portfolio;
            gameState.achievements = data.achievements || gameState.achievements;
        } catch (e) {
            console.log('Error loading saved game');
        }
    }
}

function gameOver() {
    document.getElementById('finalDays').textContent = gameState.day;
    document.getElementById('finalBalance').textContent = '$0';
    document.getElementById('finalTrades').textContent = gameState.totalTrades;
    
    document.getElementById('gameOverModal').classList.add('active');
    tg.HapticFeedback.notificationOccurred('error');
}

function restartGame() {
    gameState = {
        cash: 10000,
        day: 1,
        totalTrades: 0,
        bestDay: 0,
        portfolio: {},
        selectedCrypto: null,
        priceHistory: [],
        achievements: {
            firstTrade: false,
            millionaire: false,
            diversified: false,
            whale: false
        }
    };

    cryptocurrencies.forEach(crypto => {
        if (crypto.id === 'bitcoin') crypto.price = 50000;
        else if (crypto.id === 'ethereum') crypto.price = 3000;
        else if (crypto.id === 'solana') crypto.price = 100;
        else if (crypto.id === 'cardano') crypto.price = 1.2;
        else if (crypto.id === 'polkadot') crypto.price = 15;
        else if (crypto.id === 'binance') crypto.price = 400;
        else if (crypto.id === 'ripple') crypto.price = 0.8;
        else if (crypto.id === 'dogecoin') crypto.price = 0.12;
        
        crypto.change = 0;
        gameState.portfolio[crypto.id] = 0;
        gameState.priceHistory[crypto.id] = [crypto.price];
    });

    document.getElementById('gameOverModal').classList.remove('active');
    document.getElementById('tradeAmount').value = 0;
    
    updateHeader();
    updateCryptoList();
    updateCryptoCatalog();
    updatePortfolio();
    updateBalances();
    updateAchievements();
    updateProfile();
    
    document.getElementById('newsFeed').innerHTML = '';
    addNews('Новая игра! Удачи!', 'neutral');
    
    saveGame();
    tg.HapticFeedback.notificationOccurred('success');
}

// Start game
initGame();
