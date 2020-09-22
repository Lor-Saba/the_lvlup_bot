
var keys = require('./keys');

/**
 * 
 * @param {string} key chiave lexicon
 * @param {object} data mappa di proprietà da usare per rimpiazzare dei segnaposto presenti nel lexicon. Esempio: $(name)
 * @param {string} lang lingua (default: "en")
 */
function get(key, data = {}, lang = 'en'){

    // avverte in log della lexicon mancante e ritorna una stringa vuota
    if (!keys[key]) {
        console.log('<!> Missing lexicon: ' + key);
        return '';
    }

    // reimposta la lingua predefinita
    if (!keys[key][lang]) {
        lang = 'en';
    }

    // ritorna il lexicon parsata
    return keys[key][lang].replace(/\$\(([^\)]+)?\)/g, ($1, $2) => data[$2]);
}

module.exports = {
    get
};