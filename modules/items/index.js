// modulo con vari metodi di utilità
const utils = require('../utils');
// lista degli "items" con relativa mappa e weight totale
var entries = {};


/**
 * Get a random Entry
 */
function pick(type){
    let list = entries[type].list;
    let winner = Math.random() * entries[type].totalWeight;
    let threshold = 0;

    for (let i = 0; i < list.length; i++) {
        threshold += list[i].weight;

        if (threshold > winner) {
            return JSON.parse(JSON.stringify(list[i]));
        }
    }
}


/**
 * Get a random Item
 */
function pickItem(){
    return pick('items');
}


/**
 * Get a random Item
 */
function pickEffect(){
    return pick('effects');
}


/**
 * Get a random Item
 */
function pickEquipment(){
    return pick('equipments');
}

/**
 * 
 * @param {object} userItems lista di oggetti dell'utente con relativa quantità o data 
 */
function getItemsBuff(userItems){
    let dateNow = Date.now();
    let tempBuff = 1;
    let permBuff = 1;

    utils.each(userItems, function(key, value){
        let item = getItem(key);

        if (!item) return;

        if (item.type === 'temp') {
            if (dateNow < value + (item.timeout * 60 * 60)) {
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

function getEntry(type, name){
    return entries[type].list[entries[type].map[name]];
}

/**
 * 
 * @param {string} name nome dell'entità di tipo "items" da ottenere
 */
function getItem(name){
    return getEntry('items', name);
}

/**
 * 
 * @param {string} name nome dell'entità di tipo "effects" da ottenere
 */
function getEffect(name){
    return getEntry('effects', name);
}

/**
 * 
 * @param {string} name nome dell'entità di tipo "equipments" da ottenere
 */
function getEquipment(name){
    return getEntry('equipments', name);
}

/**
 * 
 * @param {string} name 
 */
function getItemRarityIcon(name){
    var icon = "";
    var item = getItem(name);

    if (!item) return icon;

    if (item.weight <= 5) {
        icon = "🟧";                // 5  - 0   epic
    } else if (item.weight <= 10) {
        icon = "🟪";                // 10 - 6   super rare
    } else if (item.weight <= 40) {
        icon = "🟦";                // 40 - 11  rare
    } else if (item.weight <= 70) {
        icon = "🟩";                // 70 - 41  uncommon
    } else {
        icon = "⬜️";                // oo - 71  common
    }

    return icon;
}

/**
 *  metodo di inizializzazione
 */
function init() {

    var addEntry = function(type){
        entries[type] = { 
            totalWeight: 0, 
            list: utils.shuffle(require('./' + type)), 
            map: {} 
        };

        // crea la mappa per collegare rapidamente la lista degli items con i nomi
        // e conteggia il totale del peso dei vari oggetti (usato nell'estrazione)
        utils.each(entries[type].list, (index, entry) => {
            entries[type].map[entry.name] = index;
            entries[type].totalWeight += entry.droppable ? entry.weight : 0;
        });

        // calcola e assegna la probabilità di sorteggio ad ogni oggetto
        utils.each(entries[type].list, (index, entry) => {
            entry.chance = entry.droppable ? entry.weight / entries[type].totalWeight : 0;
        });

    };

    addEntry('items');
    addEntry('effects');
    addEntry('equipments');
}

// inizializza
init();

module.exports = {
    pickItem,
    pickEffect,
    pickEquipment,

    getItem,
    getEffect,
    getEquipment,

    getItemsBuff,
    getItemRarityIcon,
};