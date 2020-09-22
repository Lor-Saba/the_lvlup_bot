
// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf, Markup } = require('telegraf');   // { Telegraf, Markup, Extra }
// estensione per poter leggere  eventuali parametri ai comanti
const commandParts = require('telegraf-command-parts');
// modulo per poter generare hash md5
const md5 = require('md5');
// modulo per gestire le traduzioni delle label
const lexicon = require('./modules/lexicon');
// modulo per gestire le operazioni di salvataggio e caricamento dati dal DB
const storage = require('./modules/storage');
// modulo con vari metodi di utilità
const utils = require('./modules/utils');
// modulo per gestire i markup per i messaggi con bottoni
const markup = require('./modules/markup');
// istanza del bot 
var bot = null;


/**
 * Connessione alle API telegram per gestire il bot
 */
function connectTelegramAPI(){
    return new Promise(function(ok){

        bot = new Telegraf(process.env["accessToken"]);

        setBotMiddlewares();
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
 * 
 */
function setBotMiddlewares(){

    bot.use(commandParts());
}

/**
 * assegnazione degli handlers per i comandi disponibili
 */
function setBotCommands(){

    // admin: 95d23b82ee9ef1b94f48bbc3870819c0

    bot.command('admin', function(ctx){
        var userId = ctx.update.message.from.id;
        var chatId = ctx.update.message.chat.id;

        if (md5(userId) === 'be6d916dafd19cddfd2573f8bb0cee4f') {
            ctx.reply('Hello Master.')
        } else {
            ctx.reply('Who de fak are iuu.. Who de fak are iuu.. whu iu iiss... who iu BE.. UH?')
        }
    })
    
    bot.command('setting', function(ctx){
        var userId = ctx.update.message.from.id;
        var chatId = ctx.update.message.chat.id;
        const markupData = markup.get('SETTING_START', ctx.update.message, { chatId: chatId });

        bot.telegram.sendMessage(userId, markupData.text, markupData.buttons).catch(utils.errorlog);
    });
    
    bot.command('test', function(ctx){
    });
    
    bot.command('prestige', function(ctx){

        var mexData = utils.getMessageData(ctx);
        
        if (mexData.isBot) return;

        var user = storage.getUser(mexData.userId);

        if (!user) return;
        if (!user.chats[mexData.chatId]) return;

        // salva il riferimento alla chat
        var chat = user.chats[mexData.chatId]; 

        if (chat.prestigeAvailable) {
            chat.exp = 0;
            chat.level = 0;
            chat.prestigePower += 1;

            ctx.reply(lexicon.get('USER_PRESTIGE_SUCCESS', { userName: mexData.userName, prestige: chat.prestigePower }));
        } else {

            // Controlla se la richiesta  è spam (60 secondi di timeout)
            if (!utils.checkifSpam(chat.lastMessage, mexData.date, 60)) {
                chat.lastMessage = mexData.date;

                ctx.reply(lexicon.get('USER_PRESTIGE_FAIL', { userName: mexData.userName }));
            }
        }

        return storage.updateUserChatData(mexData.userId, mexData.chatId, chat);
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

        var mexData = utils.getMessageData(ctx);

        if (mexData.isBot) return;

        var user =  storage.getUser(mexData.userId);

        // imposta l'oggetto dell'utente se non esiste
        if (!user) {
            user = storage.setUser(mexData.userId, { id: mexData.userId, username: mexData.userName });
        }

        // imposta l'oggetto della chat se non esiste
        if (!user.chats[mexData.chatId]){
            user.chats[mexData.chatId] = storage.setUserChat(mexData.userId, mexData.chatId, {});
        }

        // salva il riferimento alla chat
        var chat = user.chats[mexData.chatId]; 

        // Controlla se è spam
        if (!utils.checkifSpam(chat.lastMessage, mexData.date)) {
            
            // add exp based on prestige power
            var expGain = utils.calcExpGain(chat.prestigePower);
            var newExp = chat.exp + expGain;
            var newLevel = utils.calcLevelFromExp(newExp);

            // notifica l'utente se è salito di livello
            if (Math.floor(chat.level) < Math.floor(newLevel)) {
                ctx.reply(lexicon.get('USER_LEVELUP', { userName: mexData.userName, level: Math.floor(newLevel) }));
            }

            // notifica l'utente che puo' prestigiare
            if (newLevel >= 10 * expGain && chat.prestigeAvailable == false) {
                ctx.reply(lexicon.get('USER_PRESTIGE_AVAILABLE', { userName: mexData.userName, level: newLevel }));
                chat.prestigeAvailable = true;
            }

            // assegna i nuovi dati
            chat.exp = newExp;
            chat.level = newLevel;
        }

        chat.lastMessage = mexData.date;

        return storage.updateUserChatData(mexData.userId, mexData.chatId, chat);
    });

    bot.on('callback_query', function(ctx){ 
        var query = ctx.update.callback_query;
        var markupData = markup.getData(query.data);
        var messageId = query.message.id;

        console.log(query);
        console.log(markupData);
        console.log(bot.telegram);
        
        return;

        switch(markupData.action){

            case 'SETTING_START': 
                bot.telegram.sendMessage(userId, markupData.text, markupData.buttons).catch(utils.errorlog);
                break;

            case 'SETTING_NOTIFY_LEVELUP': 
                bot.telegram.sendMessage(userId, markupData.text, markupData.buttons).catch(utils.errorlog);
                break;

            case 'SETTING_NOTIFY_PRESTIGE_AVAILABLE':
                bot.telegram.sendMessage(userId, markupData.text, markupData.buttons).catch(utils.errorlog);
                break;
        }

        console.log(bot.telegram)
        console.log(ctx)
        console.log(query);
        console.log(markupData);
    });
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
        utils.errorlog('Errors in initialization, Bot not launched.')
        console.error(arguments);
    });
}

// inizializza il bot
init();