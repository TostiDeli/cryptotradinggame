// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Get user info
const user = tg.initDataUnsafe?.user;

// Hide loading screen
setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
}, 500);

// Game State - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
let gameState = {
    cash: 10000,
    day: 1,
    totalTrades: 0,
    portfolio: {},
    selectedCrypto: null,
    priceHistory: []
};

// Cryptocurrencies
const cryptocurrencies = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: '#f7931a', price: 50000, change: 0 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: '#627eea', price: 3000, change: 0 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎', color: '#00d4aa', price: 100, change: 0 }
];

// News templates
const newsTemplates = [
    { text: 'Биткоин растет!', impact: 0.1, type: 'positive' },
    { text: 'Рынок падает', impact: -0.1, type: 'negative' }
];

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
    updatePortfolio();
    updateBalances();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            const section = item.dataset.section;
            document.getElementById(section + 'Section').classList.add('active');
        });
    });

    document.getElementById('buyBtn').addEventListener('click', buyCrypto);
    document.getElementById('sellBtn').addEventListener('click', sellCrypto);
    document.getElementById('tradeAmount').addEventListener('input', updateTradeCost);
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
                background: #4ecca3;
                color: black;
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
            ">День ${gameState.day}</button>
        `;
    }
}

function updateCryptoList() {
    const cryptoList = document.getElementById('cryptoList');
    if (!cryptoList) return;
    
    cryptoList.innerHTML = '';

    cryptocurrencies.forEach(crypto => {
        const changePercent = ((crypto.change || 0) * 100).toFixed(2);
        const changeClass = changePercent >= 0 ? 'price-up' : 'price-down';
        const changeSymbol = changePercent >= 0 ? '▲' : '▼';

        const cryptoItem = document.createElement('div');
        cryptoItem.className = 'crypto-item';
        cryptoItem.onclick = () => selectCrypto(crypto.id);

        cryptoItem.innerHTML = `
            <div class="crypto-info">
                <div class="crypto-icon" style="background: ${crypto.color}20; color: ${crypto.color}">${crypto.icon}</div>
                <div>
                    <div>${crypto.name}</div>
                    <div style="font-size: 12px; opacity: 0.7;">${crypto.symbol}</div>
                </div>
            </div>
            <div>
                <div>$${crypto.price.toLocaleString()}</div>
                <div class="${changeClass}">${changeSymbol} ${Math.abs(changePercent)}%</div>
            </div>
        `;

        cryptoList.appendChild(cryptoItem);
    });
}

function selectCrypto(cryptoId) {
    gameState.selectedCrypto = cryptoId;
    const crypto = cryptocurrencies.find(c => c.id === cryptoId);
    
    document.getElementById('selectedCrypto').innerHTML = `
        <div style="padding: 10px; background: rgba(0,0,0,0.3); border-radius: 10px; margin-bottom: 10px;">
            ${crypto.name} (${crypto.symbol}) - $${crypto.price}
        </div>
    `;
    
    document.getElementById('buyBtn').disabled = false;
    document.getElementById('sellBtn').disabled = false;
}

function updateTradeCost() {
    const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    if (crypto) {
        const total = amount * crypto.price;
        document.getElementById('tradeCost').textContent = `$${total.toFixed(2)}`;
    }
}

function buyCrypto() {
    if (!gameState.selectedCrypto) {
        alert('Выберите криптовалюту');
        return;
    }

    const amount = parseFloat(document.getElementById('tradeAmount').value);
    if (amount <= 0) {
        alert('Введите количество');
        return;
    }

    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    const total = amount * crypto.price;

    if (total > gameState.cash) {
        alert('Недостаточно средств');
        return;
    }

    gameState.cash -= total;
    gameState.portfolio[crypto.id] += amount;
    gameState.totalTrades++;

    updatePortfolio();
    updateBalances();
    saveGame();
    alert(`Куплено ${amount} ${crypto.symbol}`);
}

function sellCrypto() {
    if (!gameState.selectedCrypto) {
        alert('Выберите криптовалюту');
        return;
    }

    const amount = parseFloat(document.getElementById('tradeAmount').value);
    if (amount <= 0) {
        alert('Введите количество');
        return;
    }

    const crypto = cryptocurrencies.find(c => c.id === gameState.selectedCrypto);
    
    if (gameState.portfolio[crypto.id] < amount) {
        alert('Недостаточно криптовалюты');
        return;
    }

    const total = amount * crypto.price;

    gameState.cash += total;
    gameState.portfolio[crypto.id] -= amount;
    gameState.totalTrades++;

    updatePortfolio();
    updateBalances();
    saveGame();
    alert(`Продано ${amount} ${crypto.symbol}`);
}

function updatePortfolio() {
    const portfolioList = document.getElementById('portfolioList');
    if (!portfolioList) return;
    
    portfolioList.innerHTML = '';

    cryptocurrencies.forEach(crypto => {
        const amount = gameState.portfolio[crypto.id];
        if (amount > 0) {
            const value = amount * crypto.price;
            
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.style.cssText = 'display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 8px;';
            item.innerHTML = `
                <div>${crypto.symbol} x${amount.toFixed(4)}</div>
                <div>$${value.toFixed(2)}</div>
            `;
            
            portfolioList.appendChild(item);
        }
    });

    if (portfolioList.children.length === 0) {
        portfolioList.innerHTML = '<p style="text-align: center; opacity: 0.7;">Портфель пуст</p>';
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
}

function nextDay() {
    gameState.day++;
    updateHeader();

    const news = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    
    cryptocurrencies.forEach(crypto => {
        const change = (Math.random() * 0.2) - 0.1;
        crypto.price = crypto.price * (1 + change);
        crypto.change = change;
        
        if (!gameState.priceHistory[crypto.id]) {
            gameState.priceHistory[crypto.id] = [];
        }
        gameState.priceHistory[crypto.id].push(crypto.price);
    });

    updateCryptoList();
    updatePortfolio();
    updateBalances();
    saveGame();
}

function saveGame() {
    localStorage.setItem('cryptoGame', JSON.stringify({
        cash: gameState.cash,
        day: gameState.day,
        totalTrades: gameState.totalTrades,
        portfolio: gameState.portfolio
    }));
}

function loadGame() {
    const saved = localStorage.getItem('cryptoGame');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.cash = data.cash || 10000;
            gameState.day = data.day || 1;
            gameState.totalTrades = data.totalTrades || 0;
            gameState.portfolio = data.portfolio || {};
        } catch (e) {}
    }
}

// Start game
initGame();
