// modulo con vari metodi di utilità
const utils = require('../../utils');

module.exports = {
    'NONE': {
        next: '1'
    },
    '1': {
        update: function(cache){

            cache.config.cacheVersion = '1';
            cache.config.appVersion = '0.0.0';

            utils.each(cache.users, function(userId, user){
                utils.each(user.chats, function(chatId, userStats){

                    // spostate proprietà dall'oggetto dell'utente 
                    // per inserirle nell'oggetto delle statistiche di un utente relativo ad una chat
                    userStats.lastChallengeDate = user.lastChallengeDate;
                    userStats.lastCommandDate = user.lastCommandDate;
                    userStats.lastMessageDate = user.lastMessageDate;
                    userStats.lastItemDate = user.lastItemDate;
                    userStats.penality = user.penality;

                    // resetta le statistiche delle challenge
                    userStats.challengeWon = 0;
                    userStats.challengeLost = 0;
                });
            
                // rimozione delle proprietà spostate
                delete user.lastChallengeDate;
                delete user.lastCommandDate;
                delete user.lastMessageDate;
                delete user.lastItemDate;
                delete user.penality;
            });

            utils.each(cache.chats, function(chatId, chat){
                
                // nuova proprietà "items" 
                chat.items = {};
                
                // proprietà di statistica per il mostro che appare nel fine settimana
                chat.monsterDefeated = 0;
                chat.monsterEscaped = 0;

                // oggetto per il dungeon
                chat.isDungeonActive = false;
            });

            return cache;
        },
        next: null
    }
}