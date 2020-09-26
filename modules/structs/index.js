
/**
 * 
 * @param {string} name nome struttura
 * @param {object} data dati da sovrascrivere a quelli di default della struttura richiesta
 */
function get(name, data = {}){
    return Object.assign({}, require('./data/' + name) || {}, data);
}

module.exports = { get };