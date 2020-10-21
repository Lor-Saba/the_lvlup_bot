
// modulo per gestire i numeri
const BigNumber = require('bignumber.js');

// configurazione del BigNumber
BigNumber.config({ EXPONENTIAL_AT: 6, ROUNDING_MODE: 3 });

/**
 * 
 * @param {number} exp Calcola il livello in base al valore dell'esperienza passata
 */
function calcLevelFromExp(exp) {
    // Math.sqrt(exp) * 0.44272 + 1;
    return BigNumber(exp).sqrt().multipliedBy(0.44272).plus('1');  
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
 * @param {number} penalityLevel 
 */
function calcExpGain(prestige, penalityLevel) {
    
    // Math.sqrt(Math.pow(2, prestige))
    var expGain = BigNumber(2).pow(BigNumber(prestige)).sqrt(); 
    var penalityMultiplier = 1;

    if (penalityLevel === 2){
        penalityMultiplier = .25;
    }
    if (penalityLevel === 4){
        penalityMultiplier = 0;
    }

    return expGain.multipliedBy(penalityMultiplier);
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
 * @param {string} msg messaggio di errore da loggare
 */
function errorlog(msg) {
    console.log('<!> ERROR:', msg);
}

/**
 * 
 * @param {object} user oggetto db dell'utente
 * @param {number} dateNow timestamp della data attuale (del messaggio)
 * @param {number} dateDiff tempo in secondi usato per validare lo stato di spam
 */
function calcPenality(user, dateNow, dateDiff = 1){

    var isSpam = dateNow - user.lastMessageDate < dateDiff;

    // controllo per gestire un possibile spam di messaggi
    // (viene considerato spam se è stato inviato un altro messaggio meno di 1 secondo fa)
    if (isSpam) {
        user.penality.level = Math.min(user.penality.level + 1, 4);
        user.penality.resetDate = dateNow + (user.penality.level * Math.pow(2, user.penality.level) * 5);

        /*
            reset date:
                0 🟢 - 0s       <- normal state
                1 🟡 - 10s
                2 🟠 - 40s      <- 25% exp gain
                3 🔴 - 120s
                4 ❌ - 320s     <-  0% exp gain
        */
    } else {
        if (user.penality.level > 0 && user.penality.resetDate - dateNow < 0) {
            user.penality.level = 0;
            user.penality.resetDate = 0;
        }
    }

    return isSpam;
}

/**
 * 
 * @param {number} prestige 
 */
function calcNextPrestigeLevel(prestige){
    return calcExpGain(prestige, 0).multipliedBy(15);
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

    var message = (ctx.message || ctx.editedMessage || ctx.callbackQuery && ctx.callbackQuery.message || {});
    
    const messageData = {
        message:    message,
        date:       message.date,
        isBot:      message.from.is_bot,
        isPrivate:  message.chat.type === 'private',
        username:   message.from.first_name || message.from.username,
        userId:     message.from.id,
        chatId:     message.chat.id,
        chatTitle:  message.chat.title,
        lang:       message.from.language_code
    };

    return messageData;
}

function formatNumber(num, decimals = 2){
    num = BigNumber(num);

    if (num.isGreaterThan(99999)) {
        return num.toPrecision(5);
    } else {
        return num.toFixed(num.isInteger() ? 0 : decimals)
    }
}

function toFloor(num){
    return BigNumber(num).toFixed(0, 1);
}

module.exports = {
    errorlog,
    each,
    calcExpFromLevel,
    calcLevelFromExp,
    calcExpGain,
    calcPenality,
    calcNextPrestigeLevel,
    formatBytes,
    roughSizeOfObject,
    getMessageData,
    formatNumber,
    toFloor
};