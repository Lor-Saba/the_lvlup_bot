
// modulo con vari metodi di utilità
const utils = require('../utils');
// tempo limite per poter explorare il dungeon
var spawnTimeout = 1000 * 60 * 60 * 2;

// lista dei mostri attivi
var dungeons = {};


/**
 * 
 * @param {number} chatId 
 */
function removeDungeon(chatId){
    // ottiene il riferimento al mostro da attaccare
    var dungeon = dungeons[chatId];

    // interrompe se non è stato trovato il riferimento al mostro richiesto
    if (!dungeon) return false;
    
    // interrompe i timeout
    clearTimeout(dungeon.spawnTimeoutId);

    // elimina i dati
    dungeon = null;
    delete dungeons[chatId];
}

/**
 * 
 * @param {functino} callback callback da chiamare
 * @param {object} data argomenti da passare alla callback
 */
function callEvent(callback, data){
    try {
        return callback(data);
    } catch(err) {
        utils.errorlog('DUNGEON Event: ', JSON.stringify(err));
    }
}

/**
 * 
 * @param {object} chat oggetto che rappresenta l'utente che sta attaccando il mostro
 * @param {object} user oggetto che rappresente la chat a cui appartiene il mostro
 * @param {object} ctx ctx delmessaggio ricevuto
 */
function explore(chat, user, ctx){
    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var userStats = user.chats[chat.id];
    // ottiene il riferimento al dungeon da esplorare
    var dungeon = dungeons[chat.id];
    // oggetto da restituire agli eventi
    var eventData = {
        dungeon: dungeon,
        user: user,
        userStats: userStats,
        chat: chat,
        ctx: ctx
    };

    // interrompe se non è stato trovato il riferimento al dungeon richiesto
    if (!dungeon) return false;
    
    // interrompe se la vita è a zero
    if (dungeon.expired == true) return false;

    // aggiunge l'utente se è il suo primo attacco
    if (dungeon.explorers[user.id]) {
        // chiama l'evento 
        callEvent(dungeon.onAlreadyExplored, eventData);
        return false;
    }

    // aggiunge l'utente nell'elenco di coloro che hanno gia esplorato
    dungeon.explorers[user.id] = true;

    // drichiama l'evento di aggiornamento in segioto all'esplorazione
    callEvent(dungeon.onExplore, eventData);
}

/**
 * 
 * @param {object} chat 
 * @param {object} config 
 */
function spawn(chat, config){

    var dungeon = Object.assign({
        chatId: null,
        spawnTimeoutId: null,
        expired: false,
        messageId: 0,
        explorers: {},
        extra: {},
        onSpawn: () => {},
        onExpire: () => {},
        onExplore: () => {},
        onAlreadyExplored: () => {}
    }, config);

    dungeon.chatId = chat.id;
    dungeon.spawnTimeoutId = setTimeout(() => {
        dungeon.expired = true; 

        callEvent(dungeon.onExpire, { dungeon: dungeon, chat: chat });
        removeDungeon(chat.id);
    }, spawnTimeout);

    // chiama l'evento per confermare la creazione del mostro
    callEvent(dungeon.onSpawn, { dungeon: dungeon, chat: chat });

    // inserisce il mostro nella mappa globale
    dungeons[chat.id] = dungeon;
}

module.exports = {
    spawn,
    explore
};