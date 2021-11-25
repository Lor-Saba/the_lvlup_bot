
// modulo per gestire le traduzioni delle label
const Lexicon = require('../../lexicon');

exports.lexicon = function(key) {
    return Lexicon.get(key);
};

exports.mathmax = function(a, b){
    return Math.max(Number(a), Number(b));
};

exports.mathmin = function(a, b){
    return Math.min(Number(a), Number(b));
};

exports.ifx = function (a, op, b, options) {
    var result = null;
    
	switch (op) {
        case '==':
            result = a == b;
            break;
        case '!=':
            result = a != b;
            break;
        case '>':
            result = Number(a) > Number(b);
            break;
        case '>=':
            result = Number(a) >= Number(b);
            break;
        case '<':
            result = Number(a) < Number(b);
            break;
        case '<=':
            result = Number(a) <= Number(b);
            break;
        case '||':
            result = a || b;
            break;
        case '&&':
            result = a && b;
            break;
    }

    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
};