
// IModulo per il database 
const MongoClient = require('mongodb').MongoClient;
// modulo con le strutture
const structs = require('../structs');
// modulo per gestire le operazioni di salvataggio e caricamento dati dal DB
const utils = require('../utils');
// Istanza del DB
var db = null;
// cache della lista di utenti e chat
var cache = { users: {}, chats: {} };
// liste coda da sincronizzare sul db
var queue = { users: {}, chats: {}, id: null };

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
    
            for(var ind = 0, ln = users.length; ind < ln; ind++){
                cache.users[users[ind].id] = users[ind];
            };
        });
    })
    .then(function(){
        return getCollectionContent('lvlup_chats')
        .then(chats => {
    
            for(var ind = 0, ln = chats.length; ind < ln; ind++){
                cache.chats[chats[ind].id] = chats[ind];
            };
        });
    })
    .then(function(){

        // connessione al db completata
        console.log("> MongoDB Connected");

        // loagga il contenuto della cache
        utils.each(cache, function(key, data){
            console.log('  - loaded', Object.keys(data).length, key, 'from DB.  [' + utils.roughSizeOfObject(data, true) + ']');
        });
    });
}

function checkCollections(){
    return Promise.resolve()
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
 * @param {number} userId 
 * @param {object} userData 
 */
function setUser(userId, userData){
    return cache.users[userId] = structs.get('user', userData);
}

/**
 * 
 * @param {number} userId 
 * @param {number} chatId 
 * @param {object} chatData 
 */
function setUserChat(userId, chatId, chatData){
    return cache.users[userId].chats[chatId] = structs.get('user_chat', chatData);
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

    return result;
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
    var result = { users: 0, chats: 0 };

    // rimozione di tutti i dati degli utenti
    utils.each(cache.users, function(userId){
        cache.users[userId].chats = {};
        queue.users[userId] = true;
    });
    result.users = Object.keys(queue.users).length;

    // rimozione di tutti i dati deglle chat
    utils.each(cache.chats, function(chatId){
        cache.chats[chatId] = {};
        queue.chats[chatId] = true;
    });
    result.chats = Object.keys(queue.chats).length;

    return result;
}

/**
 * 
 * @param {number} userId id dell'utente da aggiornare
 * @param {number} chatId id della chat da aggiornare
 * @param {object} chatData oggetto contenente i dati da aggiornare
 */
function updateUserChatData(userId, chatId, chatData){

    cache.users[userId].chats[chatId] = Object.assign(cache.users[userId].chats[chatId], chatData);
    queue.users[userId] = true;

    return Promise.resolve();
}

/**
 * aggiorna il DB con i dati in cache
 */
function syncDatabase(){

    var usersIdList = Object.keys(queue.users);
    var chatsIdList = Object.keys(queue.chats);

    queue.users = {};
    queue.chats = {};

    // se in coda ci sono modifiche da applicare per gli utenti..
    if (usersIdList.length > 0) {
        var operations = [];

        console.log('Saving queue to db..', usersIdList.length + ' users');

        utils.each(usersIdList, function(index, userId){
            operations.push({
                replaceOne: { 
                    filter: { id: userId }, 
                    replacement: cache.users[userId], 
                    upsert: true 
                } 
            });
        });

        try {
            db.collection("lvlup_users").bulkWrite(operations);
        } catch(err) {
            console.log(err);
        }

        usersIdList.length = 0;
        operations.length = 0;
    }

    // se in coda ci sono modifiche da applicare per le classi..
    if (chatsIdList.length > 0) {
        var operations = [];

        console.log('Saving queue to db..', chatsIdList.length + ' chats');

        utils.each(chatsIdList, function(index, chatId){
            operations.push({
                replaceOne: { 
                    filter: { id: chatId }, 
                    replacement: cache.chats[chatId], 
                    upsert: true 
                } 
            });
        });

        try {
            db.collection("lvlup_chats").bulkWrite(operations);
        } catch(err) {
            console.log(err);
        }

        chatsIdList.length = 0;
        operations.length = 0;
    }
}

/**
 * interrompe l'esecuzione dell'intervallo di sincronizzazione
 */
function stopQueue(){
    clearInterval(queue.id);
}


/**
 * avvia l'intervallo di sincronizzazione
 */
function startQueue(){

    stopQueue();

    queue.id = setInterval(syncDatabase, 1000 * 60 * 5); // 5 minuti
}

/**
 * 
 * @param {number} chatId 
 */
function getChatLeaderboard(chatId){
    var LBUsers = [];

    var getUserData = function(user){
        return {
            username: user.username,
            exp: user.chats[chatId].exp,
            level: user.chats[chatId].level,
            prestige: user.chats[chatId].prestige
        }
    };

    utils.each(cache.users, function(userId, user){
        if (!user.chats[chatId]) return true;

        var added = false;

        utils.each(LBUsers, function(index, LBUser){
            if (LBUser.exp < user.chats[chatId].exp) {
                LBUsers.splice(index, 0, getUserData(user));
                added = true;
                return false;
            } 
        });    
        
        if (!added) {
            LBUsers.push(getUserData(user));
        }
    });

    return LBUsers;
}

/**
 * Debug per l'oggetto cache
 */
function debugCache(){
    console.log(cache);
}

/**
 * Debug per l'oggetto queue
 */
function debugQueue(){
    console.log(queue);
}

module.exports = {
    connectMongoDB,
    getUser,
    setUser,
    setUserChat,
    updateUserChatData,
    startQueue,
    getChatLeaderboard,
    resetChatStats,
    resetUserStats,
    resetAll,
    debugCache,
    debugQueue
};