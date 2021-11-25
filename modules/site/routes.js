module.exports = {
    'home': {
        name: 'home',
        path: '/',
        view: 'index'
    },
    'dungeon': {
        name: 'dungeon',
        path: '/dungeon/:chatId/:userId',
        view: 'dungeon'
    },
    'leaderboard': {
        name: 'leaderboard',
        path: '/leaderboard/:chatId/',
        view: 'leaderboard'
    },
    'stats': {
        name: 'stats',
        path: '/stats/:chatId/:userId',
        view: 'stats'
    }
}