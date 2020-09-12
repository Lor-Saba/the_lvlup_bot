
// IModulo per il database 
const MongoClient = require('mongodb').MongoClient;
// modulo per poter generare hash md5
const md5 = require('md5');
// Istanza del DB
var db = null;


/**
 * 
 * @param {string} uri URI di connessione per il mongodb
 */
async function connectMongoDB(uri) {
    var client = new MongoClient(uri, { useUnifiedTopology: true });

    return client.connect().then(() => db = client.db("mymdb"));
}

/**
 * 
 * @param {number} userId id dell'utente richiesto
 */
function getUser(userId){
    var filter = { id: userId };
    
    try {
        return db.collection("lvlup_users").findOne(filter);
    } catch(err) {
        return Promise.reject(err);
    }
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
 * @param {number} userId id dell'utente da aggiornare
 * @param {number} chatId id della chat da aggiornare
 * @param {object} chatData oggetto contenente i dati da aggiornare
 */
function updateUserChatData(userId, chatId, chatData){
    var filter = { id: userId };
    var action = { 
        $set: { 
            ['chats.' + chatId + '.exp']: chatData.exp, 
            ['chats.' + chatId + '.level']: chatData.level, 
            ['chats.' + chatId + '.lastMessage']: chatData.lastMessage
        } 
    } ;
    var option = { upsert: true };
    
    try {
        return db.collection("lvlup_users").findOneAndUpdate(filter, action, option);
    } catch(err) {
        return Promise.reject(err);
    }
}

module.exports = {
    connectMongoDB: connectMongoDB,
    getAllUsers: getAllUsers,
    getUser: getUser,
    updateUserChatData: updateUserChatData
};