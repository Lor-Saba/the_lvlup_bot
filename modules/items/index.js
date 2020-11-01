// modulo con vari metodi di utilità
const utils = require('../utils');
// lista degli oggetti 
var items = require('./items');
// mappa per gli items
var itemsMap = {};
// peso totale di tutti gli items
var totalWeight = 0;

/**
 * Get a random 
 */
function pick(){
    let winner = Math.random() * totalWeight;
    let threshold = 0;

    for (let i = 0; i < items.length; i++) {
        threshold += items[i].weight;

        if (threshold > winner) {
            return JSON.parse(JSON.stringify(items[i]));
        }
    }
}

/**
 * 
 * @param {object} userItems lista di oggetti dell'utente con relativa quantità o data 
 * @param {number} currentDate data corrente per poter verificare la validità degli oggetti temporanei
 */
function getItemsBuff(userItems, currentDate){
    var tempBuff = 1;
    var permBuff = 1;

    utils.each(userItems, function(key, value){
        var item = getItem(key);

        if (!item) return;

        if (item.type === 'temp') {
            if (currentDate < value + (item.timeout * 60 * 60)) {
                tempBuff *= item.power;
            } else {
                delete userItems[key];
            }
        }
        if (item.type === 'perm') {
            permBuff += item.power * value;
        }
    });
    
    return { 
        perm: permBuff, 
        temp: tempBuff 
    };
}

/**
 * 
 * @param {string} name nome dell'oggetto da ottenere
 */
function getItem(name){
    return items[itemsMap[name]];
}

/**
 *  ⬜️ 100 - 70
 *  🟩 70 - 40
 *  🟦 40 - 15
 *  🟪 15 - 5
 *  🟧 5 - 0
 * 
 * @param {string} name 
 */
function getRarityIcon(name){
    var icon = "";
    var item = getItem(name);

    if (!item) return icon;

    if (item.weight <= 5) {
        icon = "🟧";
    } else if (item.weight <= 15) {
        icon = "🟪";
    } else if (item.weight <= 40) {
        icon = "🟦";
    } else if (item.weight <= 70) {
        icon = "🟩";
    } else {
        icon = "⬜️";
    }

    return icon;
}

/**
 *  metodo di inizializzazione
 */
function init() {
    
    // mescola la lista degli oggetti
    items = utils.shuffle(items);

    // crea la mappa per collegare rapidamente la lista degli items con i nomi
    // e conteggia il totale del peso dei vari oggetti (usato nell'estrazione)
    utils.each(items, (index, item) => {
        itemsMap[item.name] = index;
        totalWeight += item.weight;
    });

    // calcola e assegna la probabilità di sorteggio ad ogni oggetto
    utils.each(items, (index, item) => {
        item.chance = item.weight / totalWeight;
    });
}

// inizializza
init();

module.exports = {
    pick,
    getItem,
    getItemsBuff,
    getRarityIcon,
};