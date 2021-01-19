
var keys = Object.assign(
    require('./keys/challenge'),
    require('./keys/dungeon'),
    require('./keys/generic'),
    require('./keys/items'),
    require('./keys/leaderboard'),
    require('./keys/monster'),
    require('./keys/penality'),
    require('./keys/settings'),
    require('./keys/special'),
    require('./keys/stats'),
    require('./keys/updated'),
    require('./keys/user')
);

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

/**
 * Crea un wrapper del .get con assegnata di default la lingua passata
 * 
 * @param {string} defaultLang lingua con cui cercare il lexicon richiesto
 */
function lang(defaultLang = 'en'){
    return {
        get: function(key, data, lang){
            return get(key, data, lang || defaultLang);
        }
    }
}

module.exports = {
    get,
    lang
};