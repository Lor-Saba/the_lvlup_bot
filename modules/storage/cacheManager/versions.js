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

                    // nuova proprietà "equipments" in preparazione del nuovo tipo di oggetti
                    userStats.equipments = {};
                    // nuova proprietà "effects" in preparazione del nuovo tipo di oggetti
                    userStats.effects = {};
                });
            
                // rimozione delle proprietà spostate
                delete user.lastChallengeDate;
                delete user.lastCommandDate;
                delete user.lastMessageDate;
                delete user.lastItemDate;
                delete user.penality;
            });

            utils.each(cache.chats, function(chatId, chat){
                
                // nuova proprietà "effects" in preparazione del nuovo tipo di oggetti
                chat.effects = {};
                
                // oggetto per il mostro che appare nel fine settimana
                chat.monster = {
                    active: false,
                    attackable: false,
                    expired: false,
                    messageId: 0,
                    level: 1,
                    health: "0",
                    healthMax: "0",
                    attackers: {}
                };

                // oggetto per il dungeon che appare nel fine settimana
                chat.dungeon = {
                    active: false,
                    spawnDate: 0,
                    users: {}
                }
            });

            return cache;
        },
        next: null
    }
}