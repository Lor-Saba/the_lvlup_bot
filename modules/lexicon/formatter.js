
// modulo con vari metodi di utilità
const utils = require('../utils');
// modalità di rendering per il lexicon
var parseMode = 'html';

/**
 * Converte i simboli del testo all'interno di un'entità
 * 
 * @param {string} text 
 */
function parseTextIn(text){
    if (parseMode == 'markdown'){
        return text;
    } else if (parseMode == 'markdownv2'){
        return text;
    } else if (parseMode == 'html'){
        return text;
    } else {
        return text;
    }  
}

/**
 * Converte i simboli del testo all'esterno di un'entità
 * 
 * @param {string} text 
 */
function parseTextOut(text){
    if (parseMode == 'markdown'){
        return text;
    } else if (parseMode == 'markdownv2'){
        return text;
    } else if (parseMode == 'html'){
        return text;
    } else {
        return text;
    }  
}

/**
 * Formato testo in grassetto
 * 
 * @param {string} text 
 */
function bold(text){
    return function(){
        if (parseMode == 'markdown'){
            return '*' + parseTextIn(text) + '*';
        } else if (parseMode == 'markdownv2'){
            return '*' + parseTextIn(text) + '*';
        } else if (parseMode == 'html'){
            return '<b>' + parseTextIn(text) + '</b>';
        } else {
            return text;
        }        
    }
}

/**
 * Formato testo in corsivo
 * 
 * @param {string} text 
 */
function italic(text){
    return function(){
        if (parseMode == 'markdown'){
            return '_' + parseTextIn(text) + '_';
        } else if (parseMode == 'markdownv2'){
            return '_' + parseTextIn(text) + '_';
        } else if (parseMode == 'html'){
            return '<i>' + parseTextIn(text) + '</i>';
        } else {
            return text;
        }
    }
}

/**
 * Formato testo sottolineato
 * 
 * @param {string} text 
 */
function underline(text){
    return function(){
        if (parseMode == 'markdownv2'){
            return '__' + parseTextIn(text) + '__';
        } else if (parseMode == 'html'){
            return '<u>' + parseTextIn(text) + '</u>';
        } else {
            return text;
        }        
    }
}

/**
 * Formato testo barrato
 * 
 * @param {string} text 
 */
function strikethrough(text){
    return function(){
        if (parseMode == 'markdownv2'){
            return '~' + parseTextIn(text) + '~';
        } else if (parseMode == 'html'){
            return '<s>' + parseTextIn(text) + '</s>';
        } else {
            return text;
        }
    }
}

/**
 * Formato testo in monospace
 * 
 * @param {string} text 
 */
function code(text){
    return function(){
        if (parseMode == 'markdown'){
            return '`' + parseTextIn(text) + '`';
        } else if (parseMode == 'markdownv2'){
            return '`' + parseTextIn(text) + '`';
        } else if (parseMode == 'html'){
            return '<code>' + parseTextIn(text) + '</code>';
        } else {
            return text;
        }
    }
}

/**
 * Crea l'oggetto wrapper da convertire in testo
 */
function wrap(){
    var args = Array.from(arguments);
    var finalText = '';

    utils.each(args, (index, arg) => {
        if (typeof arg == 'string') {
            finalText += parseTextOut(arg);
        } else if (typeof arg == 'function') {
            finalText += arg();
        }
    });

    return finalText;
}

/**
 * ritorna il valore del parseMode
 */
function getParseMode(){
    return parseMode;
}

module.exports = {
    bold,
    italic,
    underline,
    strikethrough,
    code,
    getParseMode,
    wrap
};