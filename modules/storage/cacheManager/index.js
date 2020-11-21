// modulo per gestire i file
const fs = require('fs');
// modulo con vari metodi di utilità
const utils = require('../../utils');
// lista di procedura con le versioni
const versions = require('./versions');

/**
 * 
 * @param {object} cache cache da versionare
 */
function check(cache){

    var cacheVersion = cache.config.cacheVersion;

    if (!versions[cacheVersion]) {
        utils.errorlog('Cache version from config NOT FOUND', "\"" + cacheVersion + "\"");
        return cache;
    } else {
        utils.log('Cache version from config:', "\"" + cacheVersion + "\"");
    }

    var currentVersion = versions[cacheVersion];
    var checkVersion = function(currentVersion) {

        if (currentVersion.next) {
            utils.log('Conversion cache version to: "' + currentVersion.next + '"');

            currentVersion = versions[currentVersion.next];
            cache = currentVersion.update(cache);

            return checkVersion(currentVersion);
        } else {
            return cache;
        }
    };

    return checkVersion(currentVersion);
}

module.exports = {
    check
}