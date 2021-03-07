const { Markup } = require('telegraf');
// modulo per gestire le traduzioni delle label
const Lexicon = require('../lexicon');
// modulo per poter generare hash md5
const md5 = require('md5');

// mappa dei dati in memoria
var dataMap = {}
// lista dei markup disponibili
var markup = {

    'SETTINGS_START': function(mexData, data, lexicon){
        var result = {};

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_START');
        result.buttons = markupWrap([
            [ markupButton(mexData, lexicon.get('SETTINGS_NOTIFY_PENALITY'          , { icon: data.settings['notifyPenality']        ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_NOTIFY_PENALITY'           , key: 'notifyPenality'       })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_NOTIFY_LEVELUP'           , { icon: data.settings['notifyUserLevelup']     ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_NOTIFY_LEVELUP'            , key: 'notifyUserLevelup'    })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_NOTIFY_PRESTIGE_AVAILABLE', { icon: data.settings['notifyUserPrestige']    ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE' , key: 'notifyUserPrestige'   })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_NOTIFY_ITEM_PICKUP'       , { icon: data.settings['notifyUserPickupItem']  ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_NOTIFY_ITEM_PICKUP'        , key: 'notifyUserPickupItem' })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_EVENT_MONSTER'            , { icon: data.settings['monsterEvent']          ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_EVENT_MONSTER'             , key: 'monsterEvent'         })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_EVENT_DUNGEON'            , { icon: data.settings['dungeonEvent']          ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_EVENT_DUNGEON'             , key: 'dungeonEvent'         })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_EVENT_RIDDLES'            , { icon: data.settings['riddlesEvent']          ? '✅' : '🚫' }), Object.assign(data, { action: 'SETTINGS_EVENT_RIDDLES'             , key: 'riddlesEvent'         })) ],
            [ markupButton(mexData, lexicon.get('SETTINGS_EXIT')                                                                                      , Object.assign(data, { action: 'SETTINGS_STOP'                                                    })) ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_PENALITY': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_PENALITY');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON') , Object.assign(data, { action: 'SETTINGS_NOTIFY_PENALITY', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF'), Object.assign(data, { action: 'SETTINGS_NOTIFY_PENALITY', value: false })) 
            ],
            [ 
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' })) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  })) 
            ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_LEVELUP': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_LEVELUP');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON') , Object.assign(data, { action: 'SETTINGS_NOTIFY_LEVELUP', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF'), Object.assign(data, { action: 'SETTINGS_NOTIFY_LEVELUP', value: false })) 
            ],
            [ 
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' })) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  })) 
            ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_PRESTIGE_AVAILABLE');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON') , Object.assign(data, { action: 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF'), Object.assign(data, { action: 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE', value: false })) 
            ],
            [ 
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' })) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  }))
            ]
        ]);

        return result;
    },

    'SETTINGS_NOTIFY_ITEM_PICKUP': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_NOTIFY_ITEM_PICKUP');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON')  , Object.assign(data, { action: 'SETTINGS_NOTIFY_ITEM_PICKUP', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF') , Object.assign(data, { action: 'SETTINGS_NOTIFY_ITEM_PICKUP', value: false })) 
            ],
            [
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' })) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  }))
            ]
        ]);

        return result;
    },

    'SETTINGS_EVENT_MONSTER': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_EVENT_MONSTER');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON')   , Object.assign(data, { action: 'SETTINGS_EVENT_MONSTER', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF')  , Object.assign(data, { action: 'SETTINGS_EVENT_MONSTER', value: false })) 
            ],
            [ 
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' }) ) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  }))
            ]
        ]);

        return result;
    },

    'SETTINGS_EVENT_DUNGEON': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_EVENT_DUNGEON');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON')   , Object.assign(data, { action: 'SETTINGS_EVENT_DUNGEON', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF')  , Object.assign(data, { action: 'SETTINGS_EVENT_DUNGEON', value: false })) 
            ],
            [ 
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' }) ) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  }))
            ]
        ]);

        return result;
    },

    'SETTINGS_EVENT_RIDDLES': function(mexData, data, lexicon){
        var result = {};
        var value = data.value;

        result.text  = lexicon.get('SETTINGS_TITLE', { chatTitle: data.chatTitle });
        result.text += lexicon.get('SETTINGS_EVENT_RIDDLES');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, (value === true  ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_ON')   , Object.assign(data, { action: 'SETTINGS_EVENT_RIDDLES', value: true  })),
                markupButton(mexData, (value === false ? '🔘 ' : '') + lexicon.get('SETTINGS_REPLY_OFF')  , Object.assign(data, { action: 'SETTINGS_EVENT_RIDDLES', value: false })) 
            ],
            [ 
                markupButton(mexData, lexicon.get('SETTINGS_BACK') , Object.assign(data, { action: 'SETTINGS_START' }) ) ,
                markupButton(mexData, lexicon.get('SETTINGS_EXIT') , Object.assign(data, { action: 'SETTINGS_STOP'  }))
            ]
        ]);

        return result;
    },

    'CHALLENGE_START': function(mexData, data, lexicon){
        var result = {};

        result.text = lexicon.get('CHALLENGE_START', { username: data.username });
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_R') , Object.assign(data, { action: 'CHALLENGE_START', pick: 'R' }) ),
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_S') , Object.assign(data, { action: 'CHALLENGE_START', pick: 'S' }) ),
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_P') , Object.assign(data, { action: 'CHALLENGE_START', pick: 'P' }) )
            ],
            [
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_RAND') , Object.assign(data, { action: 'CHALLENGE_START', pick: 'RAND' }) )
            ]
        ]);
        
        return result;
    },

    'CHALLENGE_END': function(mexData, data, lexicon){
        var result = {};

        if (data.challengedUsername) {
            result.text = lexicon.get('CHALLENGE_END_DIRECT', { username: data.username, challengedUsername: data.challengedUsername });
        } else {
            result.text = lexicon.get('CHALLENGE_END', { username: data.username });
        }
        
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_R') , Object.assign(data, { action: 'CHALLENGE_END', pick: 'R' }) ),
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_S') , Object.assign(data, { action: 'CHALLENGE_END', pick: 'S' }) ),
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_P') , Object.assign(data, { action: 'CHALLENGE_END', pick: 'P' }) )
            ],
            [
                markupButton(mexData, lexicon.get('CHALLENGE_OPTION_RAND') , Object.assign(data, { action: 'CHALLENGE_END', pick: 'RAND' }) )
            ]
        ]);
        
        return result;
    },

    'LEADERBOARD': function(mexData, data, lexicon){
        var result = {};

        result.text = lexicon.get('LEADERBOARD_TITLE');
        result.buttons = markupWrap([
            [ 
                markupButton(mexData, lexicon.get('LEADERBOARD_OPTION_EXP')       , Object.assign(data, { action: 'LEADERBOARD', type: 'exp'       }) ),
                markupButton(mexData, lexicon.get('LEADERBOARD_OPTION_ABSEXP')    , Object.assign(data, { action: 'LEADERBOARD', type: 'absexp'    }) )
            ],
            [
                markupButton(mexData, lexicon.get('LEADERBOARD_OPTION_CHRATIO')   , Object.assign(data, { action: 'LEADERBOARD', type: 'chratio'   }) ),
                markupButton(mexData, lexicon.get('LEADERBOARD_OPTION_CHSUMMARY') , Object.assign(data, { action: 'LEADERBOARD', type: 'chsummary' }) )
            ]
        ]);
        
        return result;
    }

}

/**
 * 
 * @param {object} mexData oggetto del messaggio ritornato da telegram
 */
function getKeyFromMessage(mexData){
    return md5('' + mexData.chatId + mexData.userId + mexData.messageId);
    //return md5('' + mexData.chat.id + mexData.from.id);
}

/**
 * 
 * @param {object} mexData oggetto del messaggio ritornato da telegram
 */
function removePreviousMap(mexData){
    var key = getKeyFromMessage(mexData);

    delete dataMap[key];
}

/**
 * 
 * @param {object} mexData oggetto del messaggio ritornato da telegram
 * @param {string} text il testo da mostrare nel messaggio
 * @param {object} data i dati da collegare all'azione del messaggio
 */
function markupButton(mexData, text, data) {

    var dateNow = Date.now() / 1000;
    var key = getKeyFromMessage(mexData);

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
 * @param {object} mexData oggetto del messaggio ritornato da telegram
 * @param {object} data oggetto di dati da salvare nella sessione del messaggio
 */
function get(type, mexData, data){
    var lexicon = Lexicon.lang(mexData.lang);

    removePreviousMap(mexData);

    return markup[type](mexData, data, lexicon);
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
    var dateNow = Date.now() / 1000;

    for(var ind = 0, ln = keys.length; ind < ln; ind++){
        if (dateNow - dataMap[keys[ind]].date > 60 * 60 * 24){
            delete dataMap[keys[ind]];
        }
    }

}, 1000 * 60 * 60);  // 1h

/**
 * debug data in cache
 */
function getDataString(){
    return JSON.stringify(dataMap);
}

module.exports = {
    get,
    getData,
    deleteData,
    getDataString
};




// ctx.reply(JSON.stringify(ctx.update.mexData));

//console.log(ctx);

//ctx.getChatAdministrators(ctx.update.mexData.chat.id).then(function(res){
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
//    Markup.callbackButton('Send a mexData', 'mexData-add'),
//    Markup.callbackButton('Message list', 'mexData-list')
//]).extra();
//bot.telegram.sendMessage(userid, 'Settings for group "' + chatTitle + '"', Extra.markdown().markup(m => m.inlineKeyboard(menu)));