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
