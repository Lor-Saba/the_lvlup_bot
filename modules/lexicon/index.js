
var keys = require('./keys.json');
var defaultLang = 'en';

/**
 * 
 * @param {string} template Template da parsare
 * @param {object} data eventuali parametri da sostituire nel template con effettivi valori
 */
function replacer(template, data) {
    return template.replace(/\$\(([^\)]+)?\)/g, ($1, $2) => data[$2]);
}

module.exports = {

    /**
     * 
     * @param {string} key Lexicon KEY name
     * @param {object} data Map of properties used to replace placeholders in the lexicon, example $(name)
     * @param {string} lang Lexicon language (default: "en")
     */
    get: function(key, data, lang){
        data = data || {};
        lang = lang || defaultLang;
        
        return replacer(keys[key][lang], data);
    }
};