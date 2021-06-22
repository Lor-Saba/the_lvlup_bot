// modulo con vari metodi di utilità
const utils = require('../../utils');
// modulo per gestire i numeri
const BigNumber = require('bignumber.js');

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
                    userStats.challengers = {};

                    // riallinea l'exp con la nuova scalabilità del prestigio
                    var curPrestige = parseInt(userStats.prestige);
                    var curTotalExp = BigNumber(userStats.exp)

                    while(curPrestige-- > 0) curTotalExp = curTotalExp.plus(utils.calcExpGain(curPrestige).multipliedBy(1500));

                    var newPrestige = 0;

                    while(curTotalExp.isGreaterThanOrEqualTo(utils.calcNextPrestigeLevel(newPrestige))){
                        curTotalExp = curTotalExp.minus(utils.calcNextPrestigeLevel(newPrestige));
                        newPrestige += 1;
                    }

                    // assegna i nuovi valori
                    userStats.exp = curTotalExp.valueOf();
                    userStats.level = utils.calcLevelFromExp(curTotalExp).valueOf();
                    userStats.prestige = String(newPrestige);
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
            });

            return cache;
        },
        next: '2'
    },
    '2': {
        update: function(cache){

            cache.config.cacheVersion = '2';

            utils.each(cache.users, function(userId, user){
                utils.each(user.chats, function(chatId, userStats){

                    // resetta le statistiche delle challenge
                    userStats.challengeWon = 0;
                    userStats.challengeLost = 0;
                    userStats.challengers = {};

                    // rimuove tutti i drop delle challenge
                    utils.each(userStats.items, function(itemName, itemValue){
                        if (/CHW_|CHL_|CHT_/g.test(itemName)) {
                            delete userStats.items[itemName];
                        }
                    });
                });
            });

            utils.each(cache.chats, function(chatId, chat){
                
                // nuova proprietà "lastMessageDate" per segnare la data dell'utlimo messaggio
                chat.lastMessageDate = 0;
            });

            return cache;
        },
        next: '3'
    },
    '3': {
        update: function(cache){

            cache.config.cacheVersion = '3';

            utils.each(cache.users, function(userId, user){
                utils.each(user.chats, function(chatId, userStats){

                    // imposta la proprietà di incremento chance drop passivo
                    userStats.itemsDropGrow = 0;

                    // creazione nuove proprietà per tenere il conto del totale delle challenge vinte e perse
                    userStats.challengeWonTotal = userStats.challengeWon;
                    userStats.challengeLostTotal = userStats.challengeLost;
                });
            });
            
            utils.each(cache.chats, function(chatId, chat){
                
                // nuove proprietà di settings 
                chat.settings.monsterEvent = true;
                chat.settings.dungeonEvent = true;
                chat.settings.riddlesEvent = true;
            });

            return cache;
        },
        next: '4'
    },
    '4': {
        update: function(cache){

            cache.config.cacheVersion = '4';

            utils.each(cache.users, function(userId, user){
                utils.each(user.chats, function(chatId, userStats){

                    // assegna il livello
                    userStats.levelReached = userStats.level;
                });
            });

            return cache;
        },
        next: null
    }
}