
// modulo per gestire i numeri
const BigNumber = require('bignumber.js');

// configurazione del BigNumber
BigNumber.config({ EXPONENTIAL_AT: 6, ROUNDING_MODE: 1 });

// log cumulativo di debug
var debugLog = {};

/**
 * Accumulo di log di debug  per i comandi /su debug 
 */
function debug(type) {

    // compone il messaggio
    var logText = [(new Date()).toLocaleTimeString(), '|'].concat([].slice.call(arguments)).join(' ');

    // crea la sezione del tipo di debug
    if (!debugLog[type]) {
        debugLog[type] = [];
    }

    // aggiunge il testo appena creato
    debugLog[type].push(logText);

    // elimina eventuali testi di debug vecchi
    while (debugLog[type].length > 100) {
        debugLog[type].shift();
    }
}

/**
 * 
 * @param {string} type tipo di log da svuotare (lasciare vuoto per eliminarli tutti)
 */
function debugClear(type = ''){

    each(debugLog, key => {
        if (type === '' || type === key) {
            debugLog[key].length = 0;
        }
    });
}

/**
 * 
 * @param {strng} type tipo di log da ritornare
 */
function debugGet(type = '') {
    return (debugLog[type] || []).join('\n');
}

/**
 * 
 * @param {number} exp Calcola il livello in base al valore dell'esperienza passata
 */
function calcLevelFromExp(exp) {
    // Math.sqrt(exp) * 0.44272 + 1;
    return BigNumber(exp).sqrt().multipliedBy(0.44272).plus(1);  
}

/**
 * 
 * @param {number} level Calcola l'esperienza in base al valore del livello passata
 */
function calcExpFromLevel(level) {    
    // Math.pow((level - 1) / 0.44272, 2);
    return BigNumber(level).minus('1').dividedBy(0.44272).pow(2);
}

/**
 * calcola il guadagno di exp in base alla forza del prestigio
 * 
 * @param {number} prestige 
 */
function calcExpGain(prestige) {
    // Math.sqrt(Math.pow(2, prestige))
    return BigNumber(2).pow(BigNumber(prestige)).sqrt();
}

/**
 * 
 * @param {number} monsterLevel livello del mostro a cui calcolare la vita
 */
function calcMonsterHealth(monsterLevel){
    // return Math.floor(Math.sqrt(Math.pow(1.85, monsterLevel - 1)) * 25);
    return BigNumber.maximum(0, BigNumber(1.85).pow(BigNumber(monsterLevel)).sqrt().multipliedBy(25)).toFixed(0).valueOf();
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
            if (fn.call(obj[ind], ind, obj[ind]) === false) break;
    } else {
        for (var ind = 0, keys = Object.keys(obj), key = keys[ind], ln = keys.length; ind < ln; ind++, key = keys[ind] )
            if (fn.call(obj[key], key, obj[key]) === false) break;
    }
}

/**
 * 
 * @param {object|array} obj Lista da iterare
 * @param {function} fn callback
 * @param {number} timeout attesa per ogni
 */
function eachTimeout(obj, fn, timeout = 75){
    var counter = Math.max(1, timeout);

    each(obj, (key, value) => {
        setTimeout(() => fn(key, value), counter += timeout);
    });
}

/**
 * 
 */
function errorlog() {
    console.log.apply(console, [(new Date()).toLocaleString(),'<!> ERROR:'].concat([].slice.call(arguments)));
}

/**
 * 
 */
function log() {
    console.log.apply(console, [(new Date()).toLocaleString(), '|'].concat([].slice.call(arguments)));
}

/**
 * 
 * @param {object} userStats oggetto con le statistiche utente di una chat
 * @param {number} dateNow timestamp della data attuale (del messaggio)
 * @param {number} dateDiff tempo in secondi usato per validare lo stato di spam
 */
function calcPenality(userStats, dateNow, dateDiff = 1){

    var isSpam = dateNow - userStats.lastMessageDate < dateDiff;

    // controllo per gestire un possibile spam di messaggi
    // (viene considerato spam se è stato inviato un altro messaggio meno di 1 secondo fa)
    if (isSpam) {
        userStats.penality.level = Math.min(userStats.penality.level + 1, 4);
        userStats.penality.resetDate = dateNow + (userStats.penality.level * Math.pow(2, userStats.penality.level) * 5);

        /*
            reset date:
                0 🟢 - 0s       <- normal state
                1 🟡 - 10s
                2 🟠 - 40s      <- 25% exp gain
                3 🔴 - 120s
                4 ❌ - 320s     <-  0% exp gain
        */
    } else {
        if (userStats.penality.level > 0 && userStats.penality.resetDate - dateNow < 0) {
            userStats.penality.level = 0;
            userStats.penality.resetDate = 0;
        }
    }

    return isSpam;
}

/**
 * 
 * @param {number} prestige 
 */
function calcNextPrestigeLevel(prestige){
    var epm = calcExpGain(prestige);
    return epm.multipliedBy(1500).plus(epm.multipliedBy(100).multipliedBy(prestige));
}

/**
 * Restituisce il peso in byte dell'oggetto passato
 * https://stackoverflow.com/a/11900218/4136520
 * (modificato per poter ritornare il risultato formattato)
 * 
 * @param {object} object oggetto da controllare
 * @param {boolean} format definisce se ritornare il risultato formattato  (false di default)
 */
function roughSizeOfObject( object, format = false ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }

    if (format){
        return formatBytes(bytes);
    } else {
        return bytes;
    }
}

/**
 * Formatta i byte passati con notazioni Kilo/Mega/Giga/...
 * https://stackoverflow.com/a/18650828/4136520
 * 
 * @param {number} bytes 
 * @param {number} decimals numero decimali
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * ritorna un insieme delle proprietà piu utilizzate 
 * 
 * @param {object} ctx oggetto di risposta di un messaggio
 */
function getMessageData(ctx){

    var message = (ctx.message || ctx.editedMessage || ctx.callbackQuery && ctx.callbackQuery.message);

    if (!message) return null;
    
    const messageData = {
        message:    message,
        messageId:  message.message_id,
        date:       message.date,
        isMarkup:   message.reply_markup !== undefined,
        isPrivate:  ctx.chat.type === 'private',
        isBot:      ctx.from.is_bot || !!message.via_bot,
        username:   ctx.from.username || ctx.from.first_name,
        userId:     ctx.from.id,
        chatId:     ctx.chat.id,
        chatTitle:  ctx.chat.title,
        lang:       ctx.from.language_code
    };

    return messageData;
}

/**
 * Formatta i numeri di tipo BigNumber con un formato standard
 * 
 * @param {number|BigNumber|string} num 
 * @param {number} decimals 
 */
function formatNumber(num, decimals = 2){
    num = BigNumber(num);

    if (num.isGreaterThan(99999)) {
        return num.toPrecision(5);
    } else {
        return num.toFixed(num.isInteger() ? 0 : decimals)
    }
}

/**
 *  Utilizzando la libreria BigNumbers riproduce il "Math.floor(...)"
 * 
 * @param {number|BigNumber|string} num 
 */
function toFloor(num){
    return BigNumber(num).toFixed(0, 1);
}

/**
 * Mescola un array
 * 
 * @param {array} array lista da mescolare
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

/**
 * Formatta un valore in secondi mostrando i rispettivo valore in ore e minuti
 * 
 * @param {number} seconds 
 * @param {boolean} extended 
 */
function secondsToHms(seconds, extended) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 3600 % 60);

    // var g = Math.floor(seconds / 86400);
    // var h = Math.floor(seconds % 3600 % 24);
    // var m = Math.floor(seconds % 3600 / 60);
    // var s = Math.floor(seconds % 3600 % 60);

    var result = [];

    if (extended) {
        // if (g) result += g + 'g ';
        if (h) result.push(h + 'h');
        if (m) result.push(m + 'm');

        if (s || (h == 0 & m == 0)) {
            result.push(s + 's');
        }
    } else {
        result.push(('0' + h).slice(-2));
        result.push(('0' + m).slice(-2));
        result.push(('0' + s).slice(-2));
    }

    return result.join(extended ? ' ' : ':'); 
}               

/**
 * timeout concatenabile alla catena di promesse
 * 
 * @param {number} timeout tempo di attesa in ms 
 */
function promiseTimeout(timeout) {
    return arg => { return new Promise(ok => {
        setTimeout(() => ok(arg), timeout);
    }) };
};

/**
 * Ritorna casualmente uno degli elementi contenuti in "arr"
 * 
 * @param {Array} arr 
 */
function pickFromArray(arr){
    if (arr.length === 0) {
        return null;
    } else {
        return arr[parseInt(Math.random() * arr.length)];
    }    
}

module.exports = {
    log,
    errorlog,
    debug,
    debugClear,
    debugGet,
    each,
    eachTimeout,
    calcExpFromLevel,
    calcLevelFromExp,
    calcExpGain,
    calcPenality,
    calcNextPrestigeLevel,
    formatBytes,
    roughSizeOfObject,
    getMessageData,
    formatNumber,
    toFloor,
    shuffle,
    secondsToHms,
    calcMonsterHealth,
    promiseTimeout,
    pickFromArray
};