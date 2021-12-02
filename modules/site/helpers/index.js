
// modulo per gestire le traduzioni delle label
const Lexicon = require('../../lexicon');
const fs = require('fs');
const path = require('path');

exports.lexicon = function(key) {
    return Lexicon.get(key);
};

exports.mathmax = function(a, b){
    return Math.max(Number(a), Number(b));
};

exports.mathmin = function(a, b){
    return Math.min(Number(a), Number(b));
};

var svgCache = {};
exports.getsvg = function(name){

    if (svgCache[name]) {
        return svgCache[name];
    }

    var iconPath = path.normalize(path.join(__dirname, '../public/img/icons/' + name + '.svg'));
    
    if (fs.existsSync(iconPath)) {
        svgCache[name] = fs.readFileSync(iconPath, 'utf8');
        return svgCache[name];
    } else {
        return 'NO_ICON';
    }
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