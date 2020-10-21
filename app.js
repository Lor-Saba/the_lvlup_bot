
// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf, Markup } = require('telegraf');
// estensione per poter leggere eventuali parametri ai comanti
const commandParts = require('telegraf-command-parts');
// modulo per poter generare hash md5
const md5 = require('md5');
// modulo per gestire i numeri
const BigNumber = require('bignumber.js');
// modulo per gestire le traduzioni delle label
const Lexicon = require('./modules/lexicon');
// modulo per gestire le operazioni di salvataggio e caricamento dati dal DB
const storage = require('./modules/storage');
// modulo con vari metodi di utilità
const utils = require('./modules/utils');
// modulo per gestire i markup per i messaggi con bottoni
const markup = require('./modules/markup');
// modulo per creare immagini con canvas
//const canvas = require('./modules/canvas');
// istanza del bot 
var bot = null;


/**
 * Connessione alle API telegram per gestire il bot
 */
function connectTelegramAPI(){
    return new Promise(function(ok){

        bot = new Telegraf(process.env["accessToken"]);

        console.log("> Telegram connected");

        setBotMiddlewares();
        setBotCommands();
        setBotActions();
        setBotEvents();
        ok();
    });
}

/**
 * Connessione al mongodb 
 */
function connectMongoDB(){
    return new Promise(function(ok, ko){
        storage.connectMongoDB(process.env['mongodb']).then(function(){
            storage.startQueue();
            ok();
        });
    });
}

/**
 * 
 */
function setBotMiddlewares(){

    bot.use(commandParts());
    bot.use(function(ctx, next) {

        // crea un oggetto contenente le informazioni generiche del messaggio ricevuto
        var mexData = utils.getMessageData(ctx);
        var lexicon = Lexicon.lang(mexData.lang);
        var isSpam = null;
        var user =  null;
        var userStats = null;
        var chat = null;
        var oldPenalityLevel = 0;

        // metodo che salva lo stato delle variabili
        var saveState = function(){
            ctx.state.mexData = mexData;
            ctx.state.lang = mexData.lang;
            ctx.state.lexicon = lexicon;
            ctx.state.isSpam = isSpam;
            ctx.state.user = user;
            ctx.state.userStats = userStats;
            ctx.state.chat = chat;
        };

        // se è un messaggio che arriva da un bot
        if (mexData.isBot) {

            // interrompe il middlewaree continua se ci troviamo in una chat privata
            // altrimenti interrompe l'esecuzione del messaggio ricevuto
            if (mexData.isPrivate) {
                // salva i dati del messaggio per l'handler successivo 
                saveState();
                return next();
            } else {
                return false;
            }
        }

        // crea l'oggetto dell'utente se non esiste
        user = storage.getUser(mexData.userId);

        if (!user) {
            user = storage.setUser(mexData.userId, { id: mexData.userId });
        }
        
        // aggiorna il nome dell'utente
        user.username = mexData.username;
        
        // calcolo dati relativi alla chat corrente se si tratta di un gruppo
        if (!mexData.isPrivate) {

            // crea l'oggetto delle statistiche dell'utente nella chat corrente se non esiste
            userStats = user.chats[mexData.chatId]; 

            if (!userStats){
                userStats = storage.setUserChat(mexData.userId, mexData.chatId, {});
            }

            // crea l'oggetto della chat se non esiste
            chat = storage.getChat(mexData.chatId);

            if (!chat) {
                chat = storage.setChat(mexData.chatId, { id: mexData.chatId });
            }

            // aggiorna il nome della chat
            chat.title = mexData.chatTitle;

            // gestione della penalità in caso di spam
            oldPenalityLevel = user.penality.level;
            isSpam = utils.calcPenality(user, mexData.date, 1);

            if (isSpam) {

                if (oldPenalityLevel == 1) {
                    ctx.replyWithMarkdown(lexicon.get('PENALITY_LEVEL_2', { username: mexData.username }));
                }
                if (oldPenalityLevel == 3) {
                    ctx.replyWithMarkdown(lexicon.get('PENALITY_LEVEL_4', { username: mexData.username }));
                }
            }

            // aggiunge la chat in queue
            storage.addChatToQueue(chat.id);
        }

        // aggiunge l'utente in queue
        storage.addUserToQueue(user.id);
        
        // protezione spam dei comandi
        if (ctx.state.command) {
            if (mexData.date - user.lastCommandDate < 2) return false;   
             
            user.lastCommandDate = mexData.date;   
        }

        // salva i dati del messaggio per l'handler successivo 
        saveState();

        // continua con l'handler successivo
        return next();
    });
            
    console.log("  - loaded bot middlewares");
}

/**
 * assegnazione degli handlers per i comandi disponibili
 */
function setBotCommands(){

    /*
        Lista comandi:

        prestige - Give up all your exp and levels to gain a prestige! This will let you grow faster.
        leaderboard - Check who's the boss of the chat.
        stats - Check your user stats in the current chat

    */

    bot.command('su', function(ctx){
        var userId = ctx.update.message.from.id;

        if (md5(userId) !== 'be6d916dafd19cddfd2573f8bb0cee4f') return;

        var command = ctx.state.command;
        var commandArgs = command.splitArgs;
        var action = commandArgs.shift();

        console.log('=====\n/SU Command:\n', command);

        switch(action){

            case 'info':
                var text = ['Chat info.'];

                Promise.resolve()
                .then(function(){
                    // proprietà della chat -> ctx.update.message.chat.*
                    utils.each(ctx.update.message.chat, function(key, value){
                        text.push('  ' + key + ': ' + JSON.stringify(value));
                    });
                })
                .then(function(){

                    // skip if is from a private chat
                    if (ctx.update.message.chat.type == 'private') return;

                    // lista utenti amministratori
                    text.push('\nAdministrators.')
                    return bot.telegram.getChatAdministrators(ctx.update.message.chat.id).then(function(users){
                        utils.each(users, function(index, member){
                            text.push('- status: ' + member.status);

                            utils.each(member.user, function(key, value){
                                text.push('  ' + key + ': ' + JSON.stringify(value));
                            });
                        });
                    })
                })
                .then(function(){
                    // compone il messaggio
                    ctx.telegram.sendMessage(userId, text.join('\n'));
                });

                break;

            case 'reset': 
                var type = commandArgs.shift();

                if (type === 'chat') {
                    var chatId = commandArgs.shift() || ctx.update.message.chat.id;
                    var result = storage.resetChatStats(chatId);

                    // ritorna il risultato
                    ctx.reply('Reset result for chat "' + chatId + '": ' + result + ' users updated');
                } else if (type === 'user') {
                    var userId = commandArgs.shift();
                    var result = storage.resetUserStats(userId);
                    
                    // ritorna il risultato
                    ctx.reply('Reset result for chat "' + chatId + '": ' + result );
                } else if (type === 'all') {
                    var result = storage.resetAll();
                    
                    // ritorna il risultato
                    ctx.reply('Full reset completed.\nRemoved ' + result.users + ' users and ' + result.chats + ' chats');
                }
                break;

            case 'cache':
                var res = storage.debugCache();

                ctx.reply('Users: ' + res.users + '\nChats: ' + res.chats + '\n\nCache size: ' + res.size);
                break;

            case 'queue':
                var res = storage.debugQueue();

                ctx.reply('Users: ' + res.users + '\nChats: ' + res.chats + '\n\nCache size: ' + res.size);
                break;
                
            case 'sync':
                storage.syncDatabase();
                break;
        }
    })
    
    bot.command('setting', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.reply(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }

        bot.telegram.getChatAdministrators(mexData.chatId)
        .then(administrators => {
            var hasPermission = false;

            utils.each(administrators, function(index, data){
                if (data.user.id === mexData.userId) {
                    hasPermission = true;
                }
            })

            return hasPermission;
        })
        .then(permission => {

            if (permission) {

                var markupData = markup.get('SETTING_START', ctx.update.message, { chatTitle: mexData.chatTitle, chatId: mexData.chatId });

                bot.telegram.sendMessage(mexData.userId, markupData.text, markupData.buttons).catch(() => {});

                return ctx.replyWithMarkdown(lexicon.get('SETTING_PRIVATE_MESSAGE_SENT', { username: mexData.username }));
            } else {

                return ctx.replyWithMarkdown(lexicon.get('SETTING_NOPERMISSION', { username: mexData.username }));
            }
        });
    });
    
    bot.command('prestige', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.reply(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }
        
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;

        if (userStats.prestigeAvailable) {
            userStats.exp = '0';
            userStats.level = '0';
            userStats.prestige = BigNumber(userStats.prestige).plus(1).valueOf();

            ctx.reply(lexicon.get('USER_PRESTIGE_SUCCESS', { username: mexData.username, prestige: userStats.prestige }));
        } else {
                
            ctx.reply(lexicon.get('USER_PRESTIGE_FAIL', { username: mexData.username }));
        }

        return storage.addUserToQueue(mexData.userId);
    });
    
    bot.command('leaderboard', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.reply(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }

        var leaderboard = storage.getChatLeaderboard(mexData.chatId);
        var lbList = [];

        utils.each(leaderboard, function(index, userStats){
            var text = '';

            //text += index === 0 ? '👑 ' : ' ';
            text += '#' + (index + 1) + ' *' + userStats.username + '*';
            text += '\n';
            text += '       ';
            text += '‎_';
            text += BigNumber(userStats.prestige).isGreaterThan(0) ? 'ptg: ' + userStats.prestige + ' • ' : '';
            text += 'lv: ' + utils.formatNumber(utils.toFloor(userStats.level)) + ' • ';
            text += 'exp: ' + utils.formatNumber(userStats.exp);
            text += '_';

            lbList.push(text);
        });

        ctx.replyWithMarkdown(lbList.join('\n'));

        //bot.telegram.sendMessage(chatId, lbList.join('\n'), {
        //    parse_mode: 'markdown',
        //    reply_to_message_id: ctx.update.message.message_id
        //});
    });
    
    bot.command('stats', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.reply(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;

        // notifica che non è stata ancora raccolto alcuna statistica ed interrompe il comando
        if (BigNumber(userStats.exp).isEqualTo(0) 
        &&  BigNumber(userStats.level).isEqualTo(0) 
        &&  BigNumber(userStats.prestige).isEqualTo(0)) {
            return ctx.reply(lexicon.get('STATS_NOUSER', { username: mexData.username }));
        }

        var leaderboard = storage.getChatLeaderboard(mexData.chatId);
        var leaderboardPosition = leaderboard.indexOf(leaderboard.filter(userData => userData.id === user.id)[0]);
        var maxBarsLength = 12;
        var text = '';

        // aggiunge il nome e titolo
        text += lexicon.get('STATS_INFO', { username: mexData.username });
        text += '\n';

        // aggiunge la posizione dell'utente nella leaderboard se
        if (leaderboardPosition != -1) {
            text += '\n' + lexicon.get('STATS_LEADERBOARD_POSITION') + ':';

                 if (leaderboardPosition === 0) text += '  🥇';
            else if (leaderboardPosition === 1) text += '  🥈';
            else if (leaderboardPosition === 2) text += '  🥉';
            else text += '  #' + (leaderboardPosition + 1);

            text += '\n';
        }

        // agiunge le statistiche basi: Exp, Level, Prestige
        if (BigNumber(userStats.exp).isGreaterThan(0)) {
            text += '\n' + lexicon.get('LABEL_EXP') + ': ' + utils.formatNumber(userStats.exp);
        }
        if (BigNumber(userStats.level).isGreaterThan(0)) {
            text += '\n' + lexicon.get('LABEL_LEVEL') + ': ' + utils.formatNumber(utils.toFloor(userStats.level), 0);
        }
        if (BigNumber(userStats.prestige).isGreaterThan(0)){
            text += '\n' + lexicon.get('LABEL_PRESTIGE') + ': ' + utils.formatNumber(userStats.prestige, 0);
        }

        // aggiunge il livello di penalità attivo
        text += '\n';
        text += '\n' + lexicon.get('STATS_PENALITY_LEVEL');
        text += ['🟢','🟡','🟠','🔴','❌'][user.penality.level];
        text += '\n';

        // aggiunge la barre che mostra il progresso per il prossimo livello
        if (BigNumber(userStats.level).isGreaterThan(0)) {

            var levelDiff = BigNumber(userStats.level).minus(utils.toFloor(userStats.level));
                levelDiff = Number(levelDiff.valueOf());

            text += '\n' + lexicon.get('STATS_LEVEL_PROGRESS', { 
                percentage: (levelDiff * 100).toFixed(2)
            });
            text += '\n';

            for(var ind = 0; ind < maxBarsLength; ind++){
                text += (ind / maxBarsLength < levelDiff) ? '🟩' : '⬜️';
            }            
        }

        // aggiunge la barre che mostra il progresso per il prossimo prestigio
        if (BigNumber(userStats.prestige).isGreaterThan(0)) {

            var prestigeDiff = BigNumber(userStats.exp).dividedBy(utils.calcExpFromLevel(utils.calcNextPrestigeLevel(userStats.prestige)));
                prestigeDiff = Number(prestigeDiff.valueOf());

            text += '\n' + lexicon.get('STATS_PRESTIGE_PROGRESS', { 
                percentage: (prestigeDiff * 100).toFixed(2)
            });
            text += '\n';

            for(var ind = 0; ind < maxBarsLength; ind++){
                text += (ind / maxBarsLength < prestigeDiff) ? '🟦' : '⬜️';
            }            
        }

        ctx.replyWithMarkdown(text);
    });

    console.log("  - loaded bot commands");
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
    
    console.log("  - loaded bot actions");
}

/**
 * assegnazione degli handlers generici
 */
function setBotEvents(){

    bot.on('message', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        // esce se non è un messaggio scritto 
        if (mexData.isPrivate) return;

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;
            
        // calcola le nuove statistiche
        var expGain = utils.calcExpGain(userStats.prestige, user.penality.level);
        var newExp = BigNumber(userStats.exp).plus(expGain);
        var newLevel = utils.calcLevelFromExp(newExp);
        var nextPrestige = utils.calcNextPrestigeLevel(userStats.prestige);

        // notifica l'utente se è salito di livello
        if (BigNumber(utils.toFloor(userStats.level)).isLessThan(utils.toFloor(newLevel))) {
            ctx.reply(lexicon.get('USER_LEVELUP', { username: mexData.username, level: utils.toFloor(newLevel) }));
        }
        
        // notifica l'utente che puo' prestigiare
        if (BigNumber(newLevel).isGreaterThanOrEqualTo(nextPrestige) && userStats.prestigeAvailable == false) {
            ctx.reply(lexicon.get('USER_PRESTIGE_AVAILABLE', { username: mexData.username, level: utils.toFloor(newLevel) }));
            userStats.prestigeAvailable = true;
        }

        // assegna i nuovi dati
        userStats.exp = BigNumber(newExp).valueOf();
        userStats.level = BigNumber(newLevel).valueOf();

        user.lastMessageDate = mexData.date;
    });

    bot.on('callback_query', function(ctx){ 
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;
        var queryData = markup.getData(ctx.update.callback_query.data);
        var newQueryData = {};

        if (!queryData) return ctx.editMessageText(lexicon.get('SETTING_ERROR_CHATNOTFOUND'));

        switch(queryData.action){

            case 'SETTING_START': 
                newQueryData = { chatTitle: queryData.chatTitle, chatId: queryData.chatId };
                break;

            case 'SETTING_NOTIFY_PENALITY':
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return ctx.editMessageText(lexicon.get('SETTING_ERROR_CHATNOTFOUND'));

                if (typeof queryData.value === "boolean") {
                    chat.settings.notifyPenality = queryData.value;
                }
                
                newQueryData = { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyPenality 
                };
                break;

            case 'SETTING_NOTIFY_LEVELUP': 
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return ctx.editMessageText(lexicon.get('SETTING_ERROR_CHATNOTFOUND'));

                if (typeof queryData.value === "boolean") {
                    chat.settings.notifyUserLevelup = queryData.value;
                }
                
                newQueryData = { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyUserLevelup 
                };
                break;

            case 'SETTING_NOTIFY_PRESTIGE_AVAILABLE':
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return ctx.editMessageText(lexicon.get('SETTING_ERROR_CHATNOTFOUND'));

                if (typeof queryData.value === "boolean") {
                    chat.settings.notifyUserPrestige = queryData.value;
                }
                
                newQueryData = { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyUserPrestige 
                };
                break;
        }

        var markupData = markup.get(queryData.action, mexData.message, newQueryData);

        ctx.editMessageText(markupData.text, markupData.buttons).catch(utils.errorlog);
    });
    
    console.log("  - loaded bot general events");
}

/**
 * Metodo di partenza per avviare il bot
 */
function init(){
    // clear console log 
    console.clear();

    // configurazione del BigNumber
    BigNumber.config({ EXPONENTIAL_AT: 6, ROUNDING_MODE: 3 });

    // catena di metodi per l'inizializzazione
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