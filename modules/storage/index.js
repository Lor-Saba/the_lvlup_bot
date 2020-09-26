
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
async function connectMongoDB(uri) {
    var client = new MongoClient(uri, { useUnifiedTopology: true });

    return client.connect()
    .then(() => db = client.db("mymdb"))
    .then(getAllUsers)
    .then(cursor => cursor.toArray())
    .then(users => {

        for(var ind = 0, ln = users.length; ind < ln; ind++){
            cache.users[users[ind].id] = users[ind];
        };
        
        console.log('- loaded', Object.keys(cache.users).length, 'users from DB.  [' + utils.roughSizeOfObject(cache.users, true) + ']');
    });
}

/**
 * Restituisce la lista di tutti gli utenti salvati nel db
 */
function getAllUsers(){
    var filter = {};
    
    try {
        return db.collection("lvlup_users").find(filter);
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
    return cache.users[userId].chats[chatId] = structs.get('chat', chatData);
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

    var keys = Object.keys(queue.users);
    var operations = [];

    // interrompe se in coda non ci sono modifiche da applicare
    if (keys.length === 0) return;

    console.log('Saving queue to db..', keys.length + ' users');

    queue.users = {};

    for(var ind = 0, ln = keys.length; ind < ln; ind++){

        var userId = keys[ind];

        operations.push({
            updateOne: { 
                filter: { id: userId }, 
                update: { $set: { chats: cache.users[userId].chats } }, 
                upsert: true 
            } 
        });
    }

    try {
        db.collection("lvlup_users").bulkWrite(operations);
    } catch(err) {
        console.log(err);
    }

    keys.length = 0;
    operations.length = 0;
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
function startQueue(){  return;

    stopQueue();

    queue.id = setInterval(syncDatabase, 1000 * 60 * 5); // 5 minuti
}

/**
 * 
 * @param {number} chatId 
 */
function getLeaderboard(chatId){
    var keys = Object.keys(cache.users);
    var users = [];

    for(var ind = 0, ln = keys.length; ind < ln; ind++){
        var userId = keys[ind];

        if (cache.users[userId].chats[chatId]){
            users.push({
                id: userId,
                username: cache.users[userId].username,
                exp: cache.users[userId].chats[chatId].exp,
                level: cache.users[userId].chats[chatId].level
            });
        }
    }

    return users;
}


module.exports = {
    connectMongoDB,
    getAllUsers,
    getUser,
    setUser,
    setUserChat,
    updateUserChatData,
    startQueue,
    getLeaderboard,
    resetChatStats,
    resetUserStats,
    resetAll
};