
// modulo con vari metodi di utilità
const utils = require('../utils');
// modulo con vari metodi di utilità
const items = require('../items');
// modulo per gestire i numeri
const BigNumber = require('bignumber.js');
// tempo limite per poter attaccare il mostro appena spawnato
var spawnAttackTimeout = 1000 * 60 * 60 * 1;
// tempo di cooldown per attacco
var userAttackCooldown = 1000 * 60 * 30;
// tempo limite per poter abbattere il mostro
var monsterTimeLimit = 1000 * 60 * 60 * 8;

// lista dei mostri attivi
var monsters = {};


/**
 * 
 * @param {number} monsterLevel livello del mostro a cui calcolare la vita
 */
function calcMonsterHealth(monsterLevel){
    // return Math.floor(Math.sqrt(Math.pow(1.5, monsterLevel - 1)) * 25);
    return BigNumber.maximum(0, BigNumber(1.5).pow(BigNumber(monsterLevel)).sqrt().multipliedBy(25)).toFixed(0).valueOf();
}

/**
 * 
 * @param {number} chatId 
 */
function removeMonster(chatId){
    // ottiene il riferimento al mostro da attaccare
    var monster = monsters[chatId];

    // interrompe se non è stato trovato il riferimento al mostro richiesto
    if (!monster) return false;
    
    // interrompe i timeout
    clearTimeout(monster.spawnTimeoutId);
    clearTimeout(monster.attackableTimeoutId);

    // elimina i dati
    monster = null;
    delete monsters[chatId];
}

/**
 * 
 * @param {functino} callback callback da chiamare
 * @param {object} data argomenti da passare alla callback
 */
function callEvent(callback, data){
    try {
        return callback(data);
    } catch(err) {
        utils.errorlog('MONSTER Event: ', JSON.stringify(err));
        return Promise.reject();
    }
}

/**
 * 
 * @param {object} chat oggetto che rappresenta l'utente che sta attaccando il mostro
 * @param {object} user oggetto che rappresente la chat a cui appartiene il mostro
 * @param {object} ctx ctx delmessaggio ricevuto
 */
function attack(chat, user, ctx){
    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var userStats = user.chats[chat.id];
    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var itemsBuff = items.getItemsBuff(userStats.items);
    // ottiene il riferimento al mostro da attaccare
    var monster = monsters[chat.id];
    // oggetto da restituire agli eventi
    var eventData = {
        monster: monster,
        user: user,
        userStats: userStats,
        chat: chat,
        ctx: ctx
    };

    // interrompe se non è stato trovato il riferimento al mostro richiesto
    if (!monster) return false;
    
    // interrompe se la vita è a zero
    if (monster.expired == true) return false;
    
    // interrompe se la vita è a zero
    if (BigNumber(monster.health).isEqualTo(0)) return false;

    // blocca gli attacchi successivi o interrompe se non è attaccabile
    if (monster.attackable == true) {
        monster.attackable = false;
    } else {
        return false;
    }

    // aggiunge l'utente se è il suo primo attacco
    if (!monster.attackers[user.id]) {
        monster.attackers[user.id] = { username: user.username, count: 0, damage: 0, lastAttackDate: 0 };
    }
    
    // interrompe se l'utente ha già attaccato e non è passato il cooldown
    if (monster.attackers[user.id].lastAttackDate + userAttackCooldown > Date.now()){
        monster.attackable = true;

        var timeDiff = (monster.attackers[user.id].lastAttackDate + userAttackCooldown) - Date.now();

        // chiama l'evento 
        callEvent(monster.onAttackCooldown, Object.assign(eventData, { timeDiff: timeDiff }));

        // interrompe
        return;
    }

    // mostra il messaggio del primo attacco 
    if (monster.active == false) {
        monster.active = true;

        // chiama l'evento per il primo attacco
        callEvent(monster.onFirstAttack, eventData);

        // timeout per abbattere il mostro
        monster.attackableTimeoutId = setTimeout(function(){
            var triesCounter = 60;
            var expireMonster = function(){

                if (BigNumber(monster.health).isEqualTo(0)) {
                    return;
                }

                if (monster.attackable == false && triesCounter > 0) {
                    triesCounter --;
                    setTimeout(expireMonster, 1000);
                    return;
                }

                chat.monsterEscaped ++;
                monster.active = false;
                monster.attackable = false;

                // chiama l'evento di "onEscaped", il mostro non può essere piu attaccato
                callEvent(monster.onEscaped, eventData);

                // elimina il mostro
                removeMonster(chat.id);
            };

            monster.expired = true;
            expireMonster();
        }, monsterTimeLimit);
    }

    // calcola il danno da applicare
    var damage = BigNumber(userStats.level).multipliedBy(itemsBuff.attack_damage).decimalPlaces(0, 1);

    // scala la vita del mostro
    monster.health = BigNumber.maximum(0, BigNumber(monster.health).minus(damage)).valueOf();
    
    // aggiorna l'attacco dell'utente 
    monster.attackers[user.id].count ++;
    monster.attackers[user.id].damage = BigNumber(monster.attackers[user.id].damage).plus(damage).valueOf();
    monster.attackers[user.id].lastAttackDate = Date.now();

    // dopo un leggero timeout mostra lo stato del boss
    setTimeout(function(){
        if (BigNumber(monster.health).isEqualTo(0)){

            // evento per la vittoria del gruppo contro il mostro
            callEvent(monster.onDefeated, eventData);

            // incrementa il livello del mostro per la prossima apparizione e lo disattiva
            chat.monsterDefeated ++;
            monster.active = false;
            monster.expired = true;

            // elimina il mostro
            removeMonster(chat.id);
        } else {

            // evento per la vittoria del gruppo contro il mostro
            callEvent(monster.onUpdate, eventData);

            // rende nuovamente disponibile la possibilità di attaccare i mostro
            monster.attackable = true;
        }
    }, 250);
}

/**
 * 
 * @param {object} chat 
 * @param {object} config 
 */
function spawn(chat, config){

    var monster = Object.assign({
        chatId: null,
        spawnTimeoutId: null,
        attackableTimeoutId: null,
        active: false,
        attackable: true,
        expired: false,
        messageId: 0,
        level: 0,
        health: "0",
        healthMax: "0",
        attackers: {},
        extra: {},
        onSpawn: () => {},
        onExpire: () => {},
        onFirstAttack: () => {},
        onAttackCooldown: () => {},
        onUpdate: () => {},
        onDefeated: () => {},
        onEscaped: () => {}
    }, config);

    monster.chatId = chat.id;
    monster.level = chat.monsterDefeated;
    monster.health = calcMonsterHealth(monster.level);
    monster.healthMax = monster.health;
    monster.spawnTimeoutId = setTimeout(() => {
        callEvent(monster.onExpire, { monster: monster, chat: chat });
        removeMonster(chat.id);
    }, spawnAttackTimeout);

    // chiama l'evento per confermare la creazione del mostro
    callEvent(monster.onSpawn, { monster: monster, chat: chat })
    .catch(err => {
        utils.errorlog('MONSTER.SPAWN', chat.id, chat.title, JSON.stringify(err));
        removeMonster(chat.id);
    });

    // inserisce il mostro nella mappa globale
    monsters[chat.id] = monster;
}

module.exports = {
    spawn,
    attack
};