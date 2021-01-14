const { Markup } = require('telegraf');
// modulo per gestire le traduzioni delle label
const Lexicon = require('../lexicon');
// modulo per poter generare hash md5
const md5 = require('md5');

// mappa dei dati in memoria
var dataMap = {}
// lista dei markup disponibili
var markup = {

    'SETTINGS_START': function(message, data, lexicon){
        var result = {};

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_START');
        result.buttons = markupWrap([
            [ markupButton(message, lexicon.get('SETTINGS_NOTIFY_PENALITY')           , Object.assign(data, { action: 'SETTINGS_NOTIFY_PENALITY' }))           ],
            [ markupButton(message, lexicon.get('SETTINGS_NOTIFY_LEVELUP')            , Object.assign(data, { action: 'SETTINGS_NOTIFY_LEVELUP' }))            ],
            [ markupButton(message, lexicon.get('SETTINGS_NOTIFY_PRESTIGE_AVAILABLE') , Object.assign(data, { action: 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE' })) ],
            [ markupButton(message, lexicon.get('SETTINGS_NOTIFY_ITEM_PICKUP')        , Object.assign(data, { action: 'SETTINGS_NOTIFY_ITEM_PICKUP' }))        ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_PENALITY': function(message, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_PENALITY');
        result.buttons = markupWrap([
            [ 
                markupButton(message, (value === true  ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_ON') , Object.assign(data, { action: 'SETTINGS_NOTIFY_PENALITY', value: true  })),
                markupButton(message, (value === false ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_OFF'), Object.assign(data, { action: 'SETTINGS_NOTIFY_PENALITY', value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' })) 
            ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_LEVELUP': function(message, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_LEVELUP');
        result.buttons = markupWrap([
            [ 
                markupButton(message, (value === true  ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_ON') , Object.assign(data, { action: 'SETTINGS_NOTIFY_LEVELUP', value: true  })),
                markupButton(message, (value === false ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_OFF'), Object.assign(data, { action: 'SETTINGS_NOTIFY_LEVELUP', value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' })) 
            ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE': function(message, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_PRESTIGE_AVAILABLE');
        result.buttons = markupWrap([
            [ 
                markupButton(message, (value === true  ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_ON') , Object.assign(data, { action: 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE', value: true  })),
                markupButton(message, (value === false ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_OFF'), Object.assign(data, { action: 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE', value: false })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' }) )
            ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_ITEM_PICKUP': function(message, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_ITEM_PICKUP');
        result.buttons = markupWrap([
            [ 
                markupButton(message, (value === 'full'    ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_FULL')   , Object.assign(data, { action: 'SETTINGS_NOTIFY_ITEM_PICKUP', value: 'full'    })),
                markupButton(message, (value === false     ? '✅ ' : '') + lexicon.get('SETTINGS_REPLY_OFF')    , Object.assign(data, { action: 'SETTINGS_NOTIFY_ITEM_PICKUP', value: false     })) 
            ],
            [ 
                markupButton(message, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' }) )
            ]
        ]);

        return result;
    },

    'CHALLENGE_START': function(message, data, lexicon){
        var result = {};

        if (data.challengedUsername) {
            result.text = lexicon.get('CHALLENGE_START_DIRECT', { username: data.username, challengedUsername: data.challengedUsername });
        } else {
            result.text = lexicon.get('CHALLENGE_START', { username: data.username });
        }
        
        result.buttons = markupWrap([
            [ 
                markupButton(message, lexicon.get('CHALLENGE_BUTTON') , Object.assign(data, { action: 'CHALLENGE_BUTTON' }) )
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
    return md5('' + message.chat.id + message.from.id);
    //return md5('' + message.chat.id + message.from.id + message.date);
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
    var data = null;

    if (dataMap[key]) {
        data = dataMap[key].data[index];
    }

    return data;
}

/**
 * 
 * @param {string} key chiave utilizzata per riprendere l'oggetto salvato alla creazione di un bottone
 */
function deleteData(mapKey) {
    mapKey = mapKey.split(':');

    var key = mapKey[0];

    if (dataMap[key]) {
        delete dataMap[key];
    }
}


// Intervallo che controlla e rimuove gli elementi della mappa inseriti piu' di 24 ore fa
setInterval(function(){

    var keys = Object.keys(dataMap);
    var dateNow = Date.now();

    for(var ind = 0, ln = keys.length; ind < ln; ind++){
        if (dateNow - dataMap[keys[ind]].date > 1000 * 60 * 60 * 24){
            delete dataMap[keys[ind]];
        }
    }

}, 1000 * 60 * 60);  // 1h


module.exports = {
    get,
    getData,
    deleteData
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