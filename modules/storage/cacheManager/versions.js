// modulo con vari metodi di utilità
const utils = require('../../utils');

module.exports = {
    'NONE': {
        next: null
    },
    '1': {
        update: function(cache){

            cache.config.cacheVersion = '1';

            utils.each(cache.users, function(userId, user){
                utils.each(user.chats, function(chatId, chat){
                    chat.lastChallengeDate = user.lastChallengeDate;
                    chat.equipment = {};
                });

                delete user.lastChallengeDate;
            });

            return cache;
        },
        next: null
    }
}