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
