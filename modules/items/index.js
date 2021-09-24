// modulo con vari metodi di utilità
const utils = require('../utils');
// lista degli items con relativa mappa e weight totale
var items = {};
var itemsMap = {};
var itemTypes = [
    'challenge', 
    'drop', 
    'dungeon', 
    'monster', 
    'randomevent', 
    'special'
];


/**
 * Get a random item by type
 * @param {string|array} type tipo o lista di tipi dell'item da ottenere
 */
function pick(type){
    let types = type ? [].concat(type) : itemTypes;
    let totalWeight = 0;
    let winner = 0;
    let threshold = 0;

    for (let j = 0; j < types.length; j++) {
        totalWeight += items[types[j]].totalWeight;
    }

    winner = Math.random() * totalWeight;

    for (let j = 0; j < types.length; j++) {
        let list = items[types[j]].list;
    
        for (let i = 0; i < list.length; i++) {

            if (!list[i].weight) continue;

            threshold += list[i].weight;
    
            if (threshold > winner) {
                return JSON.parse(JSON.stringify(list[i]));
            }
        }
    }
}

/**
 * Get a random Item
 */
function pickDrop(){
    return pick('drop');
}

/**
 * Get a random Item
 */
function pickDungeon(){
    return pick('dungeon');
}

/**
 * Get a random Item
 */
function pickMonster(){
    return pick('monster');
}

/**
 * Get a random Item
 */
function pickRandomEvent(){
    return pick('randomevent');
}

/**
 * 
 * @param {string} target target dell'item da filtrare
 * @param {number} value valore da ricercarenegli item
 */
function pickCHFor(target, value){
    let list = items['challenge'].list;

    for (let i = 0; i < list.length; i++) {
        if (list[i].target === target && list[i].for.includes(value)) {
            return JSON.parse(JSON.stringify(list[i]));
        }
    }

    return null;
}

/**
 * 
 * @param {array|object} userItems lista di oggetti dell'utente con relativa quantità o data 
 * @param {string} target filtro
 * @param {function} callback funzione di callback per ritornare l'oggetto
 */
function eachByTarget(userItems, target, callback) {
    utils.each(userItems, function(key, value){
        let item = get(key);

        if (item && item.target == target) {
            callback(item, value);
        }
    });
}

/**
 * 
 * @param {array|object} userItems lista di oggetti dell'utente con relativa quantità o data 
 * @param {string} group filtro
 * @param {function} callback funzione di callback per ritornare l'oggetto
 */
function eachByGroup(userItems, group, callback) {
    utils.each(userItems, function(key, value){
        let item = get(key);

        if (item && item.group == group) {
            callback(item, value);
        }
    });
}

/**
 * 
 * @param {object} itemsList lista di oggetti della chat
 */
function getItemsBuff(itemsList){
    let dateNow = Date.now() / 1000;
    let result = { 
        exp: 1, 
        ch_win: 1, ch_lose: 1, ch_cd: 1,
        drop_chance: 1, drop_cd: 1,
        attack_damage: 1, attack_crit: 1, attack_cd: 1
    };

    let resultMult = JSON.parse(JSON.stringify(result));

    // modalità di operazioni per accumulare il buff dell'item
    let setTargetByType = function(target, mode, value, qnt){

        if (mode === '*') {
            resultMult[target] *= (value * qnt);
        } else if (mode === '-') {
            result[target] -= (value * qnt);
        } else if (mode === '+'){
            result[target] += (value * qnt);
        }
    }

    // per ogni item passato da trasformare in buff
    utils.each(itemsList, function(key, value){

        // ottiene il riferimento all'item 
        let item = get(key);

        // interrompe se non esiste (magari è stato eliminato)
        if (!item) return;

        // applica il buff a seconda del tipo se permanente o temporaneo
        if (item.type === 'temp') {
            if (value + (item.timeout * 60 * 60) > dateNow) {
                setTargetByType(item.target, item.powermode, item.power, 1);
            } else {
                delete itemsList[key];
            }
        }
        if (item.type === 'perm') {
            setTargetByType(item.target, item.powermode, item.power, value);
        }
    });
    
    // controlli finali per applicare i buff moltiplicativi e per non far scendere sotto zero i buff
    utils.each(result, (target, value) => result[target] = Math.max(0, value * resultMult[target]));

    // ritorna la lista dei buff
    return result;
}

/**
 * 
 * @param {object} item item da cui ricavare la label di buff
 */
function getItemBuffText(item) {
    if (item.powermode === '*') {
        return 'x' + (item.power).toFixed(1) + '';
    } else if (item.powermode === '+') {
        return '+' + (item.power * 100).toFixed(1) + '%';
    } else if (item.powermode === '-') {
        return '-' + (item.power * 100).toFixed(1) + '%';
    }

    return '';
}

/**
 * 
 * @param {string} name nome dell'item da ritornare
 */
function get(name){
    return itemsMap[name] || null;
}

/**
 * 
 * @param {string} name 
 */
function getItemRarityIcon(name){
    var icon = "";
    var item = get(name);

    if (!item) return icon;

    if (item.weight == 0) {
        icon = "🔲";                // 0 == crafted
    } else if (item.weight <= 1) {
        icon = "🟥";                // 1  -  0.001   epic
    } else if (item.weight <= 5) {
        icon = "🟧";                // 5  -  1.001   epic
    } else if (item.weight <= 10) {
        icon = "🟪";                // 10 -  5.001   super rare
    } else if (item.weight <= 40) {
        icon = "🟦";                // 40 - 10.001  rare
    } else if (item.weight <= 70) {
        icon = "🟩";                // 70 - 40.001  uncommon
    } else {
        icon = "⬜️";                // oo - 70.001  common
    }

    return icon;
}

/**
 * 
 * @param {object} userItems lista degli oggetti in possesso di un utente
 */
function checkForCraftableItem(userItems){
    let newItem = null;

    utils.each(userItems, function(itemName){
        var item = get(itemName);

        // interrompe se l'oggetto non permette di craftare altri oggetti
        if (!item.craft) return;

        // per ogni possibile ricetta craftabile con l'oggetto corrente
        utils.each(item.craft, function(index, craftableItemName){
            let craftableItem = get(craftableItemName);
            let isCraftable = true;
    
            // controlla se è possibile craftare l'oggetto nuovo con gli in oggetti possesso
            utils.each(craftableItem.recipe, function(index, requiredItem){
                if ((userItems[requiredItem.name] || 0) < requiredItem.quantity) {
                    isCraftable = false;
                    return false;
                }
            });

            // se è possibile
            if (isCraftable) {
                newItem = craftableItem;

                // rimuove gli oggetti che sono serviti per creare il nuovo oggetto
                utils.each(newItem.recipe, function(index, requiredItem){
                    userItems[requiredItem.name] -= requiredItem.quantity;

                    if (userItems[requiredItem.name] <= 0){
                        delete userItems[requiredItem.name];
                    }
                });

                // aggiunge il nuovo oggetto
                if (userItems[newItem.name]) {
                    userItems[newItem.name] ++;
                } else {
                    userItems[newItem.name] = 1;
                }

                // interrompe la ricerca di altri oggetti da craftare
                return false;
            }
        });

        // interrompe se è stato trovato un oggetto craftabile
        if (newItem) return false;
    });

    // ritorna l'oggetto craftato se è stato possibile oppure null
    return newItem;
}

/**
 * 
 * @param {object} itemsList lista di items in cui inserire il nuovo item passato
 * @param {object} item item da inserire
 */
function insertItemTo(itemsList, item){

    if (!item) return null;
    
    if (item.type === 'temp') {
        itemsList[item.name] = Date.now() / 1000;
    }
    if (item.type === 'perm') {
        if (itemsList[item.name]) {
            itemsList[item.name]++;
        } else {
            itemsList[item.name] = 1;
        }
    }
}

/**
 *  metodo di inizializzazione
 */
function init() {

    var addItem = function(itemType){

        // aggiunge l'oggetto con i dati relativi al tipo da richiedere
        items[itemType] = { 
            totalWeight: 0, 
            list: utils.shuffle(require('./types/' + itemType))
        };

        // cicla la lista degli items per parsare gli items assegnando eventuali proprietà utili
        utils.each(items[itemType].list, (index, item) => {

            // assegna il tipo dell'item come proprietà gruppo
            item.group = itemType;

            // incrementa il weigth totale 
            items[itemType].totalWeight += item.weight || 0;

            // assegna il riferimento dell'item corrente nella mappa  
            itemsMap[item.name] = item;
        });

        // calcola e assegna la probabilità di sorteggio ad ogni oggetto
        utils.each(items[itemType].list, (index, item) => {
            item.chance = item.weight ? item.weight / items[itemType].totalWeight : 0;
        });
    };

    // aggiunge gli oggetti per ogni tipo itemType registrato
    utils.each(itemTypes, (index, itemType) => addItem(itemType));
}

// inizializza
init();

module.exports = {
    pickDrop,
    pickDungeon,
    pickMonster,
    pickRandomEvent,
    pickCHFor,
    get,
    getItemsBuff,
    getItemBuffText,
    getItemRarityIcon,
    insertItemTo,
    checkForCraftableItem,
};