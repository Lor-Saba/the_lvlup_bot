const { Markup } = require('telegraf');
// modulo per gestire le traduzioni delle label
const lexicon = require('../lexicon');
// modulo per poter generare hash md5
const md5 = require('md5');

// mappa dei dati in memoria
var dataMap = {}
// lista dei markup disponibili
var markup = {

    'SETTING_START': function(message, data){
        var userName = message.from.first_name || message.from.username;
        var chatType = message.chat.type;
        var chatTitle = message.chat.title;
        var result = {};

        removePreviousMap(message);

        if (chatType == 'private') {
            result.text = lexicon.get('SETTING_START_USER', { userName: userName });
            result.buttons = markupWrap([
                [ markupButton(message, lexicon.get('SETTING_NOTIFY_LEVELUP')           , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP' }))            ],
                [ markupButton(message, lexicon.get('SETTING_NOTIFY_PRESTIGE_AVAILABLE'), Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE' })) ]
            ]);
        } else {
            result.text = lexicon.get('SETTING_START_GROUP', { chatTitle: chatTitle });
            result.buttons = markupWrap([
                [ markupButton(message, lexicon.get('SETTING_NOTIFY_LEVELUP')           , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP' }))            ],
                [ markupButton(message, lexicon.get('SETTING_NOTIFY_PRESTIGE_AVAILABLE'), Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE' })) ]
            ]);
        }

        return result;
    },

    'SETTING_NOTIFY_LEVELUP': function(message, data){
        var result = {};

        removePreviousMap(message);

        result.text = lexicon.get('SETTING_NOTIFY_LEVELUP');
        result.buttons = markupWrap([
            [ 
                markupButton(message, lexicon.get('REPLY_YES')  , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP', chatId: chatId, value: true })),
                markupButton(message, lexicon.get('REPLY_NO')   , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP', chatId: chatId, value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTING_BACK'), Object.assign(data, { action: 'SETTING_START', chatId: chatId }) 
            ]
        ]);

        return result;
    },

    'SETTING_NOTIFY_PRESTIGE_AVAILABLE': function(message, data){
        var result = {};

        removePreviousMap(message);

        result.text = lexicon.get('SETTING_NOTIFY_PRESTIGE_AVAILABLE');
        result.buttons = markupWrap([
            [ 
                markupButton(message, lexicon.get('REPLY_YES')  , Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE', chatId: chatId, value: true })),
                markupButton(message, lexicon.get('REPLY_NO')   , Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE', chatId: chatId, value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTING_BACK'), Object.assign(data, { action: 'SETTING_START', chatId: chatId }) )
            ]
        ]);

        return result;
    }

}

/**
 * 
 * @param {object} message oggetto del messaggio ritornato da telegram
 */
function getKeyFromMessage(message){
    return md5('' + message.chat.id + message.from.id + message.date);
}

/**
 * 
 * @param {object} message oggetto del messaggio ritornato da telegram
 */
function removePreviousMap(message){
    var key = getKeyFromMessage(message);

    delete dataMap[key];
}

/**
 * 
 * @param {object} message oggetto del messaggio ritornato da telegram
 * @param {string} text il testo da mostrare nel messaggio
 * @param {object} data i dati da collegare all'azione del messaggio
 */
function markupButton(message, text, data) {

    var dateNow = Date.now();
    var key = getKeyFromMessage(message);

    if (!dataMap[key]) {
        dataMap[key] = { date: dateNow, data: [] };
    }

    var index = dataMap[key].data.push(data) - 1;
    var mapKey = key + ':' + index;

    return Markup.callbackButton(text, mapKey);
}

/**
 * 
 * @param {array} buttons matrice di bottoni da mostrare sotto al messaggio
 */
function markupWrap(buttons){
    return Markup.inlineKeyboard(buttons).extra()
}

/**
 * 
 * @param {string} type chiave del markup da utilizzare
 * @param {object} message oggetto del messaggio ritornato da telegram
 * @param {object} data oggetto di dati da salvare nella sessione del messaggio
 */
function get(type, message, data){
    return markup[type](message, data);
}

/**
 * 
 * @param {string} key chiave utilizzata per riprendere l'oggetto salvato alla creazione di un bottone
 */
function getData(mapKey){
    mapKey = mapKey.split(':');

    var key = mapKey[0];
    var index = mapKey[1];

    if (dataMap[key]) {
        var data = dataMap[key].data[index];

        if (data) {
            delete dataMap[key];
            return data;
        } else {
            return null;
        }
    } else {
        return null;
    }
}


// Intervallo che controlla e rimuove gli elementi della mappa inseriti piu' di 30 minuti fa
setInterval(function(){

    var keys = Object.keys(dataMap);

    for(var ind = 0, ln = keys.length; ind < ln; ind++){
        if (Date.now() - dataMap[keys[ind]].date > 1000 * 60 * 30){
            delete dataMap[keys[ind]];
        }
    }

}, 1000 * 60 * 5);  // 5 minuti


module.exports = {
    get,
    getData
};




// ctx.reply(JSON.stringify(ctx.update.message));

//console.log(ctx);

//ctx.getChatAdministrators(ctx.update.message.chat.id).then(function(res){
//    ctx.reply(res);
//})


//const mainMenu = [
//    [
//        m.callbackButton('A', 'a')
//    ],
//    [
//        m.callbackButton('B', 'b'),
//        m.callbackButton('C', 'c')
//    ]
//];

//ctx.replyWithMarkdown('test', Extra.markdown().markup(m => m.inlineKeyboard(mainMenu)));






//Markup.inlineKeyboard([
//    Markup.callbackButton('Send a message', 'message-add'),
//    Markup.callbackButton('Message list', 'message-list')
//]).extra();
//bot.telegram.sendMessage(userid, 'Settings for group "' + chatTitle + '"', Extra.markdown().markup(m => m.inlineKeyboard(menu)));