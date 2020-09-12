


/*
    var exp = 0;
    var lastLvl = 0;

    while(lastLvl <= 10){
        var lvl = Math.floor(1 + Math.sqrt(exp) * .5);

        if (lvl > lastLvl) {
            lastLvl = lvl;
            console.log( 'Exp:', exp, 'Lvl:', lastLvl ); 
        }

        exp += 1;
    };
*/
/**
 * 
 * @param {number} exp Calcola il livello in base al valore dell'esperienza passata
 */
function calcLevelFromExp(exp) {
    // var lvl = Math.floor(Math.sqrt(exp) * 0.5) + 1;
    // var revExp = Math.pow((lvl - 1) / 0.5, 2);

    return Math.floor(Math.sqrt(exp) * 0.5) + 1;
}

/**
 * 
 * @param {number} level Calcola l'esperienza in base al valore del livello passata
 */
function calcExpFromLevel(level) {
    // var lvl = Math.floor(Math.sqrt(exp) * 0.5) + 1;
    // var revExp = Math.pow((lvl - 1) / 0.5, 2);

    return Math.pow((level - 1) / 0.5, 2);
}

/**
 * 
 * @param {object|array} obj Lista da iterare
 * @param {function} fn callback
 */
function each(obj, fn){

    if (!obj) return;
    
    if (obj.constructor === Array) {
        for (var ind = 0, ln = obj.length; ind < ln; ind++)
            if (fn.call(obj[ind], obj[ind], ind) === false) break;
    } else {
        for (var ind = 0, keys = Object.keys(obj), key = keys[ind], ln = keys.length; ind < ln; ind++, key = keys[ind] )
            if (fn.call(obj[key], obj[key], key) === false) break;
    }
}

/**
 * 
 * @param {string} msg messaggio di errore da loggare
 */
function errorlog(msg) {
    console.log('---');
    console.log('<!> ERROR:', msg);
}

/**
 * 
 * @param {id} chatId Id chat dove inviare il messaggio
 * @param {string} text Testo del messaggio
 * @param {array} buttons Array di Array. Rappresenta la griglia dei bottoni da mostrare
 */
function sendInlineMessage(bot, chatId, text, buttons){

    // var mex = ctx.update.message;
    // 
    // sendMessage(
    //     mex.chat.id,
    //     'Test messaggio con opzioni',
    //     [
    //         [{ text: '1', callback_data: 'd1' },{ text: '2', callback_data: 'd2' }],
    //         [{ text: '3', callback_data: 'd3' }]
    //     ]
    // );

    return bot.telegram.sendMessage(chatId, text, { reply_markup: { inline_keyboard: buttons } } );
}

/**
 * Controlla la differenza tra le due date passate. 
 * Fallisce se la differenza è inferioriore al terzo argomento passato (2 di default, in secondi)
 * 
 * @param {number} dateOld  
 * @param {number} DateNew 
 * @param {number} minDiff 
 */
function checkifSpam(dateOld, DateNew, minDiff = 1){
    return (DateNew - dateOld) < minDiff;
}



module.exports = {
    errorlog: errorlog,
    each: each,
    calcExpFromLevel: calcExpFromLevel,
    calcLevelFromExp: calcLevelFromExp,
    sendInlineMessage: sendInlineMessage,
    checkifSpam: checkifSpam
};