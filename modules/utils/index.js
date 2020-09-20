
// var lvl = Math.floor(Math.sqrt(exp) * 0.5) + 1;
// var revExp = Math.pow((lvl - 1) / 0.5, 2);

/**
 * 
 * @param {number} exp Calcola il livello in base al valore dell'esperienza passata
 */
function calcLevelFromExp(exp) {
    return Math.sqrt(exp) * 0.35 + 1;
}

/**
 * 
 * @param {number} level Calcola l'esperienza in base al valore del livello passata
 */
function calcExpFromLevel(level) {
    return Math.pow((level - 1) / 0.35, 2);
}

/**
 * calcola il guadagno di exp in base alla forza del prestigio
 * 
 * @param {number} prestigePower 
 */
function calcExpGain(prestigePower) {
    return Math.sqrt(Math.pow(2, prestigePower));
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
    console.log('---');
    console.log('<!> ERROR:', msg);
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

module.exports = {
    errorlog,
    each,
    calcExpFromLevel,
    calcLevelFromExp,
    checkifSpam,
    formatBytes,
    roughSizeOfObject,
    calcExpGain
};