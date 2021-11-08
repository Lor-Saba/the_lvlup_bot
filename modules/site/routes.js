module.exports = {
    'home': {
        name: 'home',
        path: '/',
        view: 'index',
        options: {},
        preRender: (route, req) => {},
        callback: (err, html) => {},
    },
    'dungeon': {
        name: 'dungeon',
        path: '/dungeon/:chatId/:userId',
        view: 'dungeon',
        options: {},
        preRender: (route, req) => {},
        callback: (err, html) => {},
    },
    'leaderboard': {
        name: 'leaderboard',
        path: '/leaderboard/:chatId/',
        view: 'leaderboard',
        options: {},
        preRender: (route, req) => {},
        callback: (err, html) => {},
    },
    'stats': {
        name: 'stats',
        path: '/stats/:chatId/:userId',
        view: 'stats',
        options: {},
        preRender: (route, req) => {},
        callback: (err, html) => {},
    }
}