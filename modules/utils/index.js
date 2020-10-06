
// var lvl = Math.floor(Math.sqrt(exp) * 0.5) + 1;
// var revExp = Math.pow((lvl - 1) / 0.5, 2);

/**
 * 
 * @param {number} exp Calcola il livello in base al valore dell'esperienza passata
 */
function calcLevelFromExp(exp) {
    return Math.sqrt(exp) * 0.44272 + 1;
}

/**
 * 
 * @param {number} level Calcola l'esperienza in base al valore del livello passata
 */
function calcExpFromLevel(level) {
    return Math.pow((level - 1) / 0.44272, 2);
}

/**
 * calcola il guadagno di exp in base alla forza del prestigio
 * 
 * @param {number} prestige 
 * @param {number} penalityLevel 
 */
function calcExpGain(prestige, penalityLevel) {

    var expGain = Math.sqrt(Math.pow(2, prestige));
    var penalityMultiplier = 1;

    if (penalityLevel === 2){
        penalityMultiplier = .25;
    }
    if (penalityLevel === 4){
        penalityMultiplier = 0;
    }

    return expGain * penalityMultiplier;
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
    return calcExpGain(prestige, 0) * 15;
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
    const messageData = {
        date: ctx.update.message.date,
        isBot: ctx.update.message.from.is_bot,
        isPrivate: ctx.update.message.chat.type === 'private',
        username: ctx.update.message.from.first_name || ctx.update.message.from.username,
        userId: ctx.update.message.from.id,
        chatId: ctx.update.message.chat.id,
        chatTitle: ctx.update.message.chat.title
    };

    return messageData;
}

function convertNumToExponential(num, limitValue = 100000000, decimals = 2) {
    num = Number(num);

    if (isNaN(num)) return null;

    if (num > limitValue) {
        return num.toExponential(decimals);
    } else {
        if (num % 1 != 0){
            return num.toFixed(decimals);
        } else {
            return num;
        }
    }
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
    convertNumToExponential
};