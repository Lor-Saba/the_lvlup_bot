// modulo per gestire i file
const fs = require('fs');
// modulo per gestire la creazione di path
const path = require('path');
const utils = require('../../utils');
// percorso alla cartella con i backup
var backupPath = path.resolve(__dirname, 'dump');

/**
 * legge da file la versione della cache
 */
function readFile(fileName){
    return new Promise((ok, ko) => {
        var filePath = path.resolve(backupPath, fileName);
        
        fs.readFile(filePath, { encoding:'utf8', flag:'r' }, (err, data) => {
            if (err) {
                ko(err);
            } else {
                ok(data);
            }
        }); 
    });
}

/**
 * Salva su file la versione della cache
 * 
 * @param {string} fileName nome del file da salvare
 * @param {string} fileData data da salvare nel file
 */
function writeFile(fileName, fileData){
    return new Promise(ok => {
        fs.writeFile(path.resolve(backupPath, fileName), fileData, 'utf8', ok);
    });
}

function removeOldBackups(){

    // Ottiene la lista dei backup archiviati nella cartella ./dump 
    // e li riordina cronologicamente dal piu vecchio al piu recente
    var files = fs.readdirSync(backupPath)
                .map(fileName => ({ 
                    name: path.resolve(backupPath, fileName), 
                    time: fs.statSync(path.resolve(backupPath, fileName)).mtime.getTime() 
                }))
                .sort((a, b) => a.time - b.time)
                .map(file => file.name);

    // rimuove i backup piu vecchi di 60 giorni
    var cleanCount = files.length - 60; 
    while(cleanCount-- > 0){
        fs.unlinkSync(files[cleanCount]);
    }
}

/**
 * 
 * @param {string} jsonData stringa json da salvare come backup con la data di oggi
 */
function save(jsonData){
    var now = new Date();
    var y = now.getFullYear();
    var m = ('0' + (now.getMonth() + 1)).slice(-2);
    var d = ('0' + (now.getDate())).slice(-2);
    var fileName = `${y}_${m}_${d}.dbtxt`;

    removeOldBackups();

    return writeFile(fileName, jsonData);
}

/**
 * 
 * @param {string} fileName nome del file da leggere
 */
function load(fileName){
    return readFile(fileName);
}

function list() {
    return new Promise((ok, ko) => {
        fs.readdir(backupPath, function (err, files) {
            
            // interrompe se si è verificato un errore
            if (err) return ko(err);

            let list = files.map(file => file.replace('.dbtxt', ''));

            ok(list);
        });   
    })

}

module.exports = {
    save,
    load,
    list
};