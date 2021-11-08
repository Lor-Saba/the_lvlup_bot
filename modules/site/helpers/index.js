exports.ifx = function (a, op, b, ) {
    var result = null;
	switch (op) {
        case '==':
            result = a == b;
            break;
        case '!=':
            result = a != b;
            break;
        case '>':
            result = a > b;
            break;
        case '>=':
            result = a >= b;
            break;
        case '<':
            result = a < b;
            break;
        case '<=':
            result = a <= b;
            break;
        case '||':
            result = a || b;
            break;
        case '&&':
            result = a && b;
            break;
    }

    return result;
};