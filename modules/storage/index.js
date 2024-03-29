
// IModulo per il database 
const MongoClient = require('mongodb').MongoClient;
// modulo per gestire i numeri
const BigNumber = require('bignumber.js');
// modulo con vari metodi di utilità
const utils = require('../utils');
// modulo con le strutture
const structs = require('../structs');
// sistema di controllo versionamento dei dati in cache
const cacheVersion = require('./cacheManager');
// modulo per la gestione di backup
const backup = require('./backup');
// istanza del DB
var db = null;
// cache della lista di utenti e chat
var cache = { users: {}, chats: {}, config: {} };
// liste coda da sincronizzare sul db
var queue = { users: {}, chats: {}, config: false, force: false };

/**
 * 
 * @param {string} uri URI di connessione per il mongodb
 */
function connectMongoDB(uri) {
    var client = new MongoClient(uri, { useUnifiedTopology: true });

    return client.connect()
    .then(() => db = client.db("mymdb"))
    .then(checkCollections)
    .then(function(){
        return getCollectionContent('lvlup_users')
        .then(users => {
            utils.each(users, function(index, user){
                delete user._id;
                cache.users[user.id] = user;
            });
        });
    })
    .then(function(){
        return getCollectionContent('lvlup_chats')
        .then(chats => {
            utils.each(chats, function(index, chat){
                delete chat._id;
                cache.chats[chat.id] = chat;
            });
        });
    })
    .then(function(){
        return getCollectionContent('lvlup_config')
        .then(results => {
            var config = results[0] || structs.get('config');
            delete config._id;

            cache.config = config;
        });
    })
    .then(function(){
        var oldCacheVersion = cache.config.cacheVersion;
        // controlla ed applica eventuali aggiornamenti dei dati in cache
        cache = cacheVersion.check(cache);

        if (oldCacheVersion != cache.config.cacheVersion) {
            setForcedSync(true);
        }
    })
    .then(function(){

        // connessione al db completata
        console.log("> MongoDB Connected");

        // loagga il contenuto della cache
        utils.each(cache, function(key, data){
            if (key == 'config') return;
            console.log('  - loaded', Object.keys(data).length, key, 'from DB.  [' + utils.roughSizeOfObject(data, true) + ']');
        });
    });
}

/**
 * Controlla se esiste le collezioni sul db, crea quelle che non trova
 */
function checkCollections(){
    return Promise.resolve()
    .then(function(){
        return db.createCollection('lvlup_config').catch(err => {});
    })
    .then(function(){
        return db.createCollection('lvlup_users').catch(err => {});
    })
    .then(function(res){
        return db.createCollection('lvlup_chats').catch(err => {});
    })
}

/**
 * Restituisce la lista di tutti i documenti salvati nella collezione
 */
function getCollectionContent(collectionName){
    var filter = {};
    
    try {
        return db.collection(collectionName).find(filter).toArray();
    } catch(err) {
        return Promise.reject(err);
    }
}

/**
 * 
 * @param {number} userId id utente
 */
function getUser(userId){
    return cache.users[userId];
}

/**
 * 
 * @param {number} chatId id chat
 */
function getChat(chatId){
    return cache.chats[chatId];
}

/**
 * 
 */
function getChats(){
    return cache.chats;
}

/**
 * 
 * @param {number} userId 
 * @param {object} userData 
 */
function setUser(userId, userData){
    cache.users[userId] = structs.get('user', userData);
    queue.users[userId] = true;

    return cache.users[userId];
}

/**
 * 
 * @param {number} userId 
 * @param {number} chatId 
 * @param {object} chatData 
 */
function setUserChat(userId, chatId, chatData){
    cache.users[userId].chats[chatId] = structs.get('user_chat', chatData);
    queue.users[userId] = true;

    return cache.users[userId].chats[chatId];
}

/**
 * 
 * @param {number} chatId 
 * @param {object} chatData 
 */
function setChat(chatId, chatData){
    cache.chats[chatId] = structs.get('chat', chatData);
    queue.chats[chatId] = true;
    
    return cache.chats[chatId];
}

/**
 * 
 * @param {number} chatId 
 */
function resetChatStats(chatId){
    var keys = Object.keys(cache.users);
    var result = 0;

    if (!chatId) return result;

    for(var ind = 0, ln = keys.length; ind < ln; ind++){
        var userId = keys[ind];

        if (cache.users[userId].chats[chatId]){
            cache.users[userId].chats[chatId] = structs.get('chat');
            queue.users[userId] = true;
            result++;
        }
    }

    var newChat = structs.get('chat', { 
        id: cache.chats[chatId].id,
        title: cache.chats[chatId].title
    });
    
    cache.chats[chatId] = newChat;
    queue.chats[chatId] = true;

    return result;
}

/**
 * 
 * @param {number} chatId 
 */
function deleteChat(chatId){

    if (!chatId) return null;
    if (!cache.chats[chatId]) return null;

    delete cache.chats[chatId];
    delete queue.chats[chatId];

    var keys = Object.keys(cache.users);
    var operations = [];

    for(var ind = 0, ln = keys.length; ind < ln; ind++){
        var userId = keys[ind];

        // elimina l'oggetto relativo alla chat
        delete cache.users[userId].chats[chatId];

        // aggiunge in queue l'user se contiene le statistiche di altre chat,
        if (Object.keys(cache.users[userId].chats).length) {
            queue.users[userId] = true;
        } else {

            // elimina l'oggetto dell'user
            delete cache.users[userId];

            // aggiunge l'user in coda per l'eliminazione dal db
            operations.push({
                deleteOne: { filter: { id: Number(userId) } } 
            });
        }
        
    }

    // elimina la chat
    db.collection("lvlup_chats").deleteOne({ id: Number(chatId) })
    .catch(err => {
        utils.errorlog('deleteChat | lvlup_chats', JSON.stringify(err));
    });

    // elimina gli user vuoti
    if (operations.length) {
        db.collection("lvlup_users").bulkWrite(operations)
        .catch(err => {
            utils.errorlog('deleteChat | lvlup_users', JSON.stringify(operations), JSON.stringify(err));
        });
    }
}
 
/**
 * elimina tutte le chat dell'utente indicato
 * 
 * @param {number} userId 
 */
function resetUserStats(userId){
    var result = false;

    if (!userId) return result;

    if (cache.users[userId]) {
        cache.users[userId].chats = {};
        queue.users[userId] = true;
        result = true;
    }

    return result;
}

/**
 * Reset completo di tutti i dati del bot
 */
function resetAll(){

    var result = { 
        users: Object.keys(cache.users).length, 
        chats: Object.keys(cache.chats).length
    };

    // pulisce la cache
    cache.users = {};
    cache.chats = {};

    // pulisce la coda di salvataggio
    queue.users = {};
    queue.chats = {};

    // elimina il db di tutti i documenti
    db.collection("lvlup_users").deleteMany({});
    db.collection("lvlup_chats").deleteMany({});

    return result;
}

/**
 * 
 * @param {number} userId id dell'utente da aggiornare
 */
function addUserToQueue(userId){

    queue.users[userId] = true;
    
    return Promise.resolve();
}

/**
 * 
 * @param {number} chatId id della chat da aggiornare
 */
function addChatToQueue(chatId){

    queue.chats[chatId] = true;

    return Promise.resolve();
}

/**
 * imposta se al prossimo sync deve essere forzato il salvataggio di tutta la cache
 * 
 * @param {boolean} value stato (true|false)
 */
function setForcedSync(value) {
    queue.force = !!value;
}

/**
 * aggiorna il DB con i dati in cache
 * 
 * @param {boolean} force force to save all
 */
function syncDatabase(force){

    var usersIdList = Object.keys(queue.users);
    var chatsIdList = Object.keys(queue.chats);
    var saveConfig  = queue.config;

    if (force === true || queue.force === true){
        usersIdList = Object.keys(cache.users);
        chatsIdList = Object.keys(cache.chats);
        saveConfig  = true;
    }

    queue.users = {};
    queue.chats = {};
    queue.config = false;
    queue.force = false;

    // se in coda ci sono modifiche da applicare per gli utenti..
    if (usersIdList.length > 0) {
        var operations = [];

        // console.log('Saving queue to db..', usersIdList.length + ' users');

        utils.each(usersIdList, function(index, userId){
            operations.push({
                replaceOne: { 
                    filter: { id: Number(userId) }, 
                    replacement: cache.users[userId], 
                    upsert: true 
                } 
            });
        });

        db.collection("lvlup_users").bulkWrite(operations)
        .catch(err => {
            utils.errorlog('syncDatabase | lvlup_users', JSON.stringify(operations), JSON.stringify(err));
        })
        .then(() => {
            usersIdList.length = 0;
            operations.length = 0;
        });
    }

    // se in coda ci sono modifiche da applicare per le classi..
    if (chatsIdList.length > 0) {
        var operations = [];

        // console.log('Saving queue to db..', chatsIdList.length + ' chats');

        utils.each(chatsIdList, function(index, chatId){
            operations.push({
                replaceOne: { 
                    filter: { id: Number(chatId) }, 
                    replacement: cache.chats[chatId], 
                    upsert: true 
                } 
            });
        });

        db.collection("lvlup_chats").bulkWrite(operations)
        .catch(err => {
            utils.errorlog('syncDatabase | lvlup_chats', JSON.stringify(operations), JSON.stringify(err));
        })
        .then(() => {
            chatsIdList.length = 0;
            operations.length = 0;
        });
    }

    // se in coda ci sono modifiche da applicare per la config..
    if (saveConfig) {
        var operations = [{
            replaceOne: { 
                filter: { id: -1 }, 
                replacement: cache.config, 
                upsert: true 
            } 
        }];

        db.collection("lvlup_config").bulkWrite(operations)
        .catch(err => {
            utils.errorlog('syncDatabase | lvlup_config', JSON.stringify(operations), JSON.stringify(err));
        })
        .then(() => {
            operations.length = 0;
        });
    }
}

/**
 * 
 * @param {number} chatId 
 */
function getChatUsers(chatId){
    var chatUsers = [];

    var getUserData = function(user){
        return {
            id: user.id,
            username: user.username,
            exp: user.chats[chatId].exp,
            level: user.chats[chatId].level,
            prestige: user.chats[chatId].prestige,
            challengeWon: user.chats[chatId].challengeWon,
            challengeLost: user.chats[chatId].challengeLost,
            challengeWonTotal: user.chats[chatId].challengeWonTotal,
            challengeLostTotal: user.chats[chatId].challengeLostTotal,
            challengePoints: (user.chats[chatId].challengeWon * 2) - (user.chats[chatId].challengeLost * 1)
        }
    };

    utils.each(cache.users, function(userId, user){
        if (!user.chats[chatId]) return true;
            
        chatUsers.push(getUserData(user));
    });

    return chatUsers;
}

/**
 * Debug per l'oggetto cache
 */
function debugCache(){
    return {
        users: Object.keys(cache.users).length,
        chats: Object.keys(cache.chats).length,
        size: utils.roughSizeOfObject(cache, true)
    }
}

/**
 * Debug per l'oggetto queue
 */
function debugQueue(){
    console.log(queue);

    return {
        users: Object.keys(queue.users).length,
        chats: Object.keys(queue.chats).length,
        size: utils.roughSizeOfObject(queue, true)
    }
}

/**
 * 
 */
function getCache() {
    return JSON.stringify(cache);
}

/**
 * 
 */
function saveBackup(){
    return backup.save(JSON.stringify(cache));
}

/**
 * 
 * @param {string} fileName nome del backup da caricare
 */
function loadBackup(fileName){
    return backup.load(fileName).then(res => {
        queue.users = {};
        queue.chats = {};
        queue.config = false;

        cache = JSON.parse(res);
    });
}

/**
 * 
 * @param {string} fileName nome del backup da caricare
 */
function getBackup(fileName){
    return backup.load(fileName);
}

/**
 * 
 */
function listBackup(){
    return backup.list();
}

/**
 * restituisce la versione conosciuta dell'app 
 */
function getVersion(){
    return cache.config.appVersion;
}

/**
 * imposta la versione conosciuta dell'app 
 * 
 * @param {string} version  
 */
function setVersion(version){
    cache.config.appVersion = version;
    queue.config = true;
}

/**
 * 
 * @param {function} callback 
 */
function checkChatsVitality(callback){
    var now = Date.now() / 1000;
    var timeNotify = 60 * 60 * 24 * 23; // 23 giorni
    var timeRemove = 60 * 60 * 24 * 31; // 31 giorni

    utils.eachTimeout(cache.chats, (chatId, chat) => {
        var diffTime = now - chat.lastMessageDate;

        if (diffTime > timeNotify && diffTime < timeRemove) {
            callback(chat, 'INACTIVE');
        } else if (diffTime > timeRemove) {
            callback(chat, 'TOBEREMOVED');
            deleteChat(chatId);
        }
    }, 100);
}

/**
 * 
 * @param {Number} oldChatId 
 * @param {Number} newChatId 
 */
function updateChatId(oldChatId, newChatId){

    // aggiorna i riferimenti per la chat in cache
    cache.chats[newChatId] = cache.chats[oldChatId];
    cache.chats[newChatId].id = newChatId;

    // aggiorna i riferimenti per la chat in queue
    queue.chats[newChatId] = queue.chats[oldChatId];

    // per ogni utente
    utils.each(cache.users, (userId, user) => {

        // interrompe se non ha la chat
        if (!user.chats[oldChatId]) return;
            
        // aggiorna il riferimento della chat per l'utente
        user.chats[newChatId] = user.chats[oldChatId];
        delete user.chats[oldChatId];
    });

    // aggiorna il db
    setForcedSync(true);
    syncDatabase();

    // rimuove dal db il documento con la vecchia chat 
    deleteChat(oldChatId);
}

function eachUsers(callback){
    utils.each(cache.users, function(userId, user){
        callback(user);
    });
}

module.exports = {
    connectMongoDB,
    getUser,
    getChat,
    getChats,
    setUser,
    setChat,
    setUserChat,
    getChatUsers,
    resetChatStats,
    resetUserStats,
    resetAll,
    debugCache,
    debugQueue,
    syncDatabase,
    addUserToQueue,
    addChatToQueue,
    getCache,
    saveBackup,
    loadBackup,
    listBackup,
    getBackup,
    getVersion,
    setVersion,
    setForcedSync,
    checkChatsVitality,
    updateChatId,
    eachUsers
};