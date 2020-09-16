
// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf, Markup, Extra } = require('telegraf');
// modulo per poter generare hash md5
const md5 = require('md5');
// modulo per gestire le traduzioni delle label
const lexicon = require('./modules/lexicon');
// modulo per gestire le operazioni di salvataggio e caricamento dati dal DB
const storage = require('./modules/storage');
// modulo con vari metodi di utilità
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
        setBotActions();
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
            storage.startQueue();
            
            console.log("> MongoDB Connected");
            ok();
        });
    });
}

/**
 * assegnazione degli handlers per i comandi disponibili
 */
function setBotCommands(){

    // admin: 95d23b82ee9ef1b94f48bbc3870819c0
    
    bot.command('setting', function(ctx){

    });
    
    bot.command('test', function(ctx){
        // ctx.reply(JSON.stringify(ctx.update.message));

        //console.log(ctx);

        //ctx.getChatAdministrators(ctx.update.message.chat.id).then(function(res){
        //    ctx.reply(res);
        //})
        

       //const mainMenu = [
       //    [
       //        m.callbackButton('A', 'a')
       //    ],
       //    [
       //        m.callbackButton('B', 'b'),
       //        m.callbackButton('C', 'c')
       //    ]
       //];

       //ctx.replyWithMarkdown('test', Extra.markdown().markup(m => m.inlineKeyboard(mainMenu)));

    });
    
    bot.command('prestige', function(ctx){
        
        if (ctx.update.message.from.is_bot) return;

        var messageDate = ctx.update.message.date;
        var userName = ctx.update.message.from.first_name || ctx.update.message.from.username;
        var userid = ctx.update.message.from.id;
        var chatid = ctx.update.message.chat.id;

        var user = storage.getUser(userid);

        if (!user) return;
        if (!user.chats[chatid]) return;

        // salva il riferimento alla chat
        var chat = user.chats[chatid]; 

        if (chat.prestigeAvailable) {
            chat.exp = 0;
            chat.level = 0;
            chat.prestigePower += 1;

            ctx.reply(lexicon.get('USER_PRESTIGE_SUCCESS', { userName: userName, prestige: chat.prestigePower }));
        } else {

            // Controlla se la richiesta  è spam (60 secondi di timeout)
            if (!utils.checkifSpam(chat.lastMessage, messageDate, 60)) {
                chat.lastMessage = messageDate;

                ctx.reply(lexicon.get('USER_PRESTIGE_FAIL', { userName: userName }));
            }
        }

        return storage.updateUserChatData(userid, chatid, chat);
    });
    
}

/**
 * assegnazione degli handlers per le azioni disponibili
 */
function setBotActions(){

    // admin: 95d23b82ee9ef1b94f48bbc3870819c0
    
    // bot.action('markdown-test-1', function(ctx){
    //     ctx.reply('markdown-test-1');
    // });
    // 
    // bot.action('markdown-test-2', function(ctx){
    //     ctx.reply('markdown-test-2');
    // });
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

        var user =  storage.getUser(userid);

        // imposta l'oggetto dell'utente se non esiste
        if (!user) {
            user = storage.setUser(userid, { id: userid, username: userName });
        }

        // imposta l'oggetto della chat se non esiste
        if (!user.chats[chatid]){
            user.chats[chatid] = storage.setUserChat(userid, chatid, {});
        }

        // salva il riferimento alla chat
        var chat = user.chats[chatid]; 

        // Controlla se è spam
        if (!utils.checkifSpam(chat.lastMessage, messageDate)) {
            
            // add exp based on prestige power
            var expGain = utils.calcExpGain(chat.prestigePower);
            var newExp = chat.exp + expGain;
            var newLevel = utils.calcLevelFromExp(newExp);

            // notifica l'utente se è salito di livello
            if (Math.floor(chat.level) < Math.floor(newLevel)) {
                ctx.reply(lexicon.get('USER_LEVEL_UP', { userName: userName, level: Math.floor(newLevel) }));
            }

            // notifica l'utente che puo' prestigiare
            if (newLevel >= 10 * expGain && chat.prestigeAvailable == false) {
                ctx.reply(lexicon.get('USER_PRESTIGE_AVAILABLE', { userName: userName, level: newLevel }));
                chat.prestigeAvailable = true;
            }

            // assegna i nuovi dati
            chat.exp = newExp;
            chat.level = newLevel;
        }

        chat.lastMessage = messageDate;

        return storage.updateUserChatData(userid, chatid, chat);
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