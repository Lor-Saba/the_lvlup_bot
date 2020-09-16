function get(name, data){
    return Object.assign({}, require('./data/' + name) || {}, data);
}

module.exports = { get };