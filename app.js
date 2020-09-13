
// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf } = require('telegraf');
// modulo per gestire le traduzioni delle label
const lexicon = require('./modules/lexicon');
// modulo per gestire le operazioni di salvataggio e caricamento dati dal DB
const storage = require('./modules/storage');
// modulo per gestire le operazioni di salvataggio e caricamento dati dal DB
const utils = require('./modules/utils');
// istanza del bot 
var bot = null;


/**
 * Connessione alle API telegram per gestire il bot
 */
function connectTelegramAPI(){
    return new Promise(function(ok){

        bot = new Telegraf(process.env["accessToken"]);

        setBotCommands();
        setBotEvents();

        console.log("> Telegram connected");
        ok();
    });
}

/**
 * Connessione al mongodb di cloudno.de e salvataggio dell'istanza
 */
function connectMongoDB(){
    return new Promise(function(ok, ko){
        storage.connectMongoDB(process.env['mongodb']).then(function(){
            console.log("> MongoDB Connected");
            ok();
        });
    });
}

/**
 * assegnazione degli handlers per i comandi disponibili
 */
function setBotCommands(){
    
    bot.command('test', function(ctx){
        ctx.reply(JSON.stringify(ctx.update.message));
    });
}

/**
 * assegnazione degli handlers generici
 */
function setBotEvents(){

    bot.on('message', function(ctx){

        if (ctx.update.message.from.is_bot) return;

        var messageDate = ctx.update.message.date;
        var userName = ctx.update.message.from.first_name || ctx.update.message.from.username;
        var userid = ctx.update.message.from.id;
        var chatid = ctx.update.message.chat.id;

        return storage
        .getUser(userid)
        .then(function(res){

            var user = res || { id: userid, chats: {} };                            // fallback di un utente vuoto con l'id utente attuale
            var chat = user.chats[chatid] || { exp: 0, level: 0, lastMessage: 0 };  // fallback di una chat vuota l'id chat attuale

            // Controlla se è spam
            if (!utils.checkifSpam(chat.lastMessage, messageDate)) {
                
                var newExp = chat.exp + 1;
                var newLevel = utils.calcLevelFromExp(newExp);

                // notifica l'utente se è salito di livello
                if (chat.level < newLevel) {
                    ctx.reply(lexicon.get('USER_LEVEL_UP', { userName: userName, level: newLevel }));
                }

                chat.exp = newExp;
                chat.level = newLevel;
            }

            chat.lastMessage = messageDate;

            console.log(userName, chat);

            return storage.updateUserChatData(userid, chatid, chat);
        });
    });

    // bot.on('callback_query', function(ctx){
    //     var cbQuery = ctx.update.callback_query;
    //     
    //     return ctx.reply(cbQuery.data);
    // });
}

/**
 * Metodo di partenza per avviare il bot
 */
function init(){
    // clear console log 
    console.clear();

    // catena di metodi necessari per l'inizializzazione
    Promise.resolve()
    .then(connectMongoDB)
    .then(connectTelegramAPI)
    .then(() => {
        // Avvia il bot
        bot.launch();
        console.log('-----\nBot running!')
    })
    .catch(() => {
        // Errore
        errorlog('Errors in initialization, Bot not launched.')
        console.error(arguments);
    });
}

// inizializza il bot
init();