const { Markup } = require('telegraf');
// modulo per gestire le traduzioni delle label
const Lexicon = require('../lexicon');
// modulo per poter generare hash md5
const md5 = require('md5');

// mappa dei dati in memoria
var dataMap = {}
// lista dei markup disponibili
var markup = {

    'SETTING_START': function(message, data, lexicon){
        var result = {};

        result.text  = lexicon.get('SETTING_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTING_START');
        result.buttons = markupWrap([
            [ markupButton(message, lexicon.get('SETTING_NOTIFY_PENALITY')           , Object.assign(data, { action: 'SETTING_NOTIFY_PENALITY' }))           ],
            [ markupButton(message, lexicon.get('SETTING_NOTIFY_LEVELUP')            , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP' }))            ],
            [ markupButton(message, lexicon.get('SETTING_NOTIFY_PRESTIGE_AVAILABLE') , Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE' })) ]
        ]);

        return result;
    },

    'SETTING_NOTIFY_PENALITY': function(message, data, lexicon){
        var result = {};
        var iconYes = data.value === true ? '✅ ': '';
        var iconNo = data.value === false ? '✅ ': '';

        result.text  = lexicon.get('SETTING_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTING_NOTIFY_PENALITY');
        result.buttons = markupWrap([
            [ 
                markupButton(message, iconYes + lexicon.get('SETTINGS_REPLY_YES') , Object.assign(data, { action: 'SETTING_NOTIFY_PENALITY', value: true })),
                markupButton(message, iconNo + lexicon.get('SETTINGS_REPLY_NO')   , Object.assign(data, { action: 'SETTING_NOTIFY_PENALITY', value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTING_BACK') , Object.assign(data, { action: 'SETTING_START' })) 
            ]
        ]);

        return result;
    },

    'SETTING_NOTIFY_LEVELUP': function(message, data, lexicon){
        var result = {};
        var iconYes = data.value === true ? '✅ ': '';
        var iconNo = data.value === false ? '✅ ': '';

        result.text  = lexicon.get('SETTING_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTING_NOTIFY_LEVELUP');
        result.buttons = markupWrap([
            [ 
                markupButton(message, iconYes + lexicon.get('SETTINGS_REPLY_YES') , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP', value: true })),
                markupButton(message, iconNo + lexicon.get('SETTINGS_REPLY_NO')   , Object.assign(data, { action: 'SETTING_NOTIFY_LEVELUP', value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTING_BACK') , Object.assign(data, { action: 'SETTING_START' })) 
            ]
        ]);

        return result;
    },

    'SETTING_NOTIFY_PRESTIGE_AVAILABLE': function(message, data, lexicon){
        var result = {};
        var iconYes = data.value === true ? '✅ ': '';
        var iconNo = data.value === false ? '✅ ': '';

        result.text  = lexicon.get('SETTING_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTING_NOTIFY_PRESTIGE_AVAILABLE');
        result.buttons = markupWrap([
            [ 
                markupButton(message, iconYes + lexicon.get('SETTINGS_REPLY_YES') , Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE', value: true })),
                markupButton(message, iconNo + lexicon.get('SETTINGS_REPLY_NO')   , Object.assign(data, { action: 'SETTING_NOTIFY_PRESTIGE_AVAILABLE', value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTING_BACK') , Object.assign(data, { action: 'SETTING_START', }) )
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

    var index = dataMap[key].data.push(JSON.parse(JSON.stringify(data))) - 1;
    var mapKey = key + ':' + index;

    return Markup.callbackButton(text, mapKey);
}

/**
 * 
 * @param {array} buttons matrice di bottoni da mostrare sotto al messaggio
 */
function markupWrap(buttons){
    return Markup.inlineKeyboard(buttons).extra({ parse_mode: 'markdown' });
}

/**
 * 
 * @param {string} type chiave del markup da utilizzare
 * @param {object} message oggetto del messaggio ritornato da telegram
 * @param {object} data oggetto di dati da salvare nella sessione del messaggio
 */
function get(type, message, data){
    var lexicon = Lexicon.lang(message.from.language_code);

    removePreviousMap(message);

    return markup[type](message, data, lexicon);
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