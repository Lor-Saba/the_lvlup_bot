// modulo con vari metodi di utilità
const utils = require('../utils');
// lista di riddles attivi
var riddles = {
    'INVERTWORD': function(){
        var min = 10;
        var max = 16;
        var chars = 'QWERTYUIOPASDFGHJKLZXCVBNM';
        var ln = parseInt(min + (max - min) * Math.random());
        var text = '';

        for(var ind = 0; ind < ln; ind++) {
            text += chars[Math.floor(chars.length * Math.random())];
        }

        return {
            text: text,
            target: text.split("").reverse().join("")
        };
    },
    'OPERATION': function(){
        var min = 3;
        var max = 6;
        var operations = parseInt(min + (max - min) * Math.random());
        var text = '';
        
        text = String(Math.floor(25 * Math.random()));

        while (operations-- >= 0) {
            var op = Math.random();

            if (op < 1 / 3) {
                var newNum = Math.floor(25 * Math.random());
                text += ' + ' + newNum;
            } else if (op < 2 / 3) {
                var newNum = Math.floor(10 * Math.random());
                text += ' - ' + newNum;
            } else {
                var newNum = Math.floor(10 * Math.random());
                text += ' * ' + newNum;
            }
        }

        return {
            text: text,
            target: eval(text)
        };
    },
    'FINDNUMBER': function(){
        var ln = 6;
        var values = [];
        var pick = Math.random() > 0.5 ? 'max' : 'min';

        for(var ind = 0; ind < ln; ind++) {
            var newNum = Math.floor(99999 * Math.random());

            if (values.includes(newNum) == false) {
                values.push(newNum);
            } else {
                ind--;
            }            
        }

        return {
            pick: pick.toUpperCase(),
            text: values.join(', '),
            target: Math[pick](...values)
        };
    },
    'DIALALPHABET': function(){
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var position = Math.max(2, parseInt(5 * Math.random()));
        var direction = Math.random() > 0.5 ? 'after' : 'before';
        var pick = -1;
        var target = -1;

        while (!alphabet[target]) {
            pick = Math.floor(alphabet.length * Math.random());

            if (direction == 'before') {
                target = pick - position;
            } else {
                target = pick + position;
            }            
        }

        return {
            direction: direction,
            position: position,
            text: alphabet[pick],
            target: alphabet[target],
        };
    }
}
// tipi di indovinelli
var riddlesTypes = Object.keys(riddles);
// lista dei riddles attivi
var activeRiddles = {};
// tempo limite per poter rispondere al riddle
var spawnTimeout = 1000 * 60 * 60 ;

/**
 * 
 * @param {functino} callback callback da chiamare
 * @param {object} data argomenti da passare alla callback
 */
function callEvent(callback, data){
    try {
        return callback(data);
    } catch(err) {
        utils.errorlog('RIDDLES Event: ', JSON.stringify(err));
        return Promise.reject();
    }
}

/**
 * Rimuove l'oggetto del riddle 
 * @param {number} chatId 
 */
function removeRiddle(chatId){

    if (!activeRiddles[chatId]) return;

    clearTimeout(activeRiddles[chatId].spawnTimeoutId);

    delete activeRiddles[chatId];
}

/**
 * 
 * @param {string} text testo da controllare con il risultato del riddle attivo
 * @param {object} chat oggetto che rappresenta la chat dove cercare un eventuale riddle
 * @param {object} user oggetto che rappresente l'utente che sta cercando di indovinare
 * @param {object} ctx ctx del messaggio ricevuto
 */
function check(text, chat, user, ctx){

    if (!activeRiddles[chat.id]) return;
    if (String(activeRiddles[chat.id].data.target) != text) return;

    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var userStats = user.chats[chat.id];
    // oggetto riddle della chat
    var riddle = activeRiddles[chat.id];
    // oggetto da restituire agli eventi
    var eventData = {
        riddle: riddle,
        user: user,
        userStats: userStats,
        chat: chat,
        ctx: ctx
    };

    // richiama l'evento di successo per aver indovinato il riddle
    callEvent(riddle.onGuess, eventData);

    removeRiddle(chat.id);
}

/**
 * 
 * @param {object} chat 
 * @param {object} config 
 */
function spawn(chat, config){

    var riddle = Object.assign({
        chatId: null,
        type: null,
        data: null,
        spawnTimeoutId: null,
        extra: {},
        onSpawn: () => {},
        onExpire: () => {},
        onGuess: () => {}
    }, config);

    riddle.chatId = chat.id;
    riddle.type = riddlesTypes[Math.floor(Math.random() * riddlesTypes.length)];
    riddle.data = riddles[riddle.type]();
    riddle.spawnTimeoutId = setTimeout(() => {
        callEvent(riddle.onExpire, { riddle: riddle, chat: chat });
        removeRiddle(chat.id);
    }, spawnTimeout);

    // chiama l'evento per confermare la creazione del riddle
    callEvent(riddle.onSpawn, { riddle: riddle, chat: chat });

    // inserisce il riddle nella mappa globale
    activeRiddles[chat.id] = riddle;
}

module.exports = {
    spawn,
    check
};