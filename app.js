
// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf, Markup } = require('telegraf');
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
                    ctx.reply('Reset result for chat "' + chatId + '": ' + result + ' Users updated');
                } else if (type === 'user') {
                    var userId = commandArgs.shift();
                    var result = storage.resetUserStats(userId);
                    
                    // ritorna il risultato
                    ctx.reply('Reset result for chat "' + chatId + '": ' + result );
                } else if (type === 'all') {
                    var result = storage.resetAll();
                    
                    // ritorna il risultato
                    ctx.reply('Full reset completed.\nUsers: ' + result.users + ' | Chats: ' + result.chats);
                }
                break;

            case 'cache':
                storage.debugCache();
                break;

            case 'queue':
                storage.debugQueue();
                break;
                
            case 'sync':
                storage.syncDatabase();
                break;
        }
    })
    
    bot.command('setting', function(ctx){
        var userId = ctx.update.message.from.id;
        var chatId = ctx.update.message.chat.id;
        var markupData = markup.get('SETTING_START', ctx.update.message, { chatId: chatId, userId: userId });

        bot.telegram
        .sendMessage(userId, markupData.text, markupData.buttons)
        .catch(function(){
            console.log(arguments);
        });
    });
    
    bot.command('prestige', function(ctx){

        var mexData = utils.getMessageData(ctx);
        
        if (mexData.isBot) return;

        var user = storage.getUser(mexData.userId);

        if (!user) return;
        if (!user.chats[mexData.chatId]) return;

        // salva il riferimento alla chat
        var userStats = user.chats[mexData.chatId]; 

        if (userStats.prestigeAvailable) {
            userStats.exp = 0;
            userStats.level = 0;
            userStats.prestige += 1;

            ctx.reply(lexicon.get('USER_PRESTIGE_SUCCESS', { userName: mexData.userName, prestige: userStats.prestige }));
        } else {

            // Controlla se la richiesta  è spam (60 secondi di timeout)
            if (!utils.checkifSpam(userStats.lastMessage, mexData.date, 60)) {
                userStats.lastMessage = mexData.date;

                ctx.reply(lexicon.get('USER_PRESTIGE_FAIL', { userName: mexData.userName }));
            }
        }

        return storage.updateUserChatData(mexData.userId, mexData.chatId, userStats);
    });
    
    bot.command('leaderboard', function(ctx){

        if (ctx.update.message.chat.type === 'private') return;

        var chatId = ctx.update.message.chat.id;
        var leaderboard = storage.getChatLeaderboard(chatId);
        var lbList = [];

        utils.each(leaderboard, function(index, userStats){
            var text = '';

            //text += index === 0 ? '👑 ' : ' ';
            text += '#' + (index + 1) + ' *' + userStats.username + '*';
            text += '\n';
            text += '       ';
            text += '‎_';
            text += userStats.prestige > 0 ? 'prg: ' + userStats.prestige + ' • ' : '';
            text += 'lv: ' + utils.convertNumToExponential(Math.floor(userStats.level)) + ' • ';
            text += 'exp: ' + utils.convertNumToExponential(userStats.exp);
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

        if (ctx.update.message.chat.type === 'private') {
            return ctx.reply(lexicon.get('STATS_GROUPONLY'));
        }
        
        var mexData = utils.getMessageData(ctx);
        var user = storage.getUser(mexData.userId);
        var userStats = user.chats[mexData.chatId];
        var barsMaxLength = 12;
        var text = '';

        if (!user || !userStats) {
            return ctx.reply(lexicon.get('STATS_NOUSER', { userName: mexData.userName }));
        }

        var leaderboard = storage.getChatLeaderboard(mexData.chatId);
        var userInLB = leaderboard.filter(userData => userData.id === user.id)[0];
        var leaderboardPosition = leaderboard.indexOf(userInLB);

        text += lexicon.get('STATS_INFO', { userName: mexData.userName });
        text += '\n';

        // 🥇🥈🥉🏆👑

        if (leaderboardPosition != -1) {
            text += '\n' + lexicon.get('STATS_LEADERBOARD_POSITION') + ':';

                 if (leaderboardPosition === 0) text += '  🥇';
            else if (leaderboardPosition === 1) text += '  🥈';
            else if (leaderboardPosition === 2) text += '  🥉';
            else text += '  #' + (leaderboardPosition + 1);

            text += '\n';
        }

        if (userStats.exp > 0) {
            text += '\n' + lexicon.get('LABEL_EXP') + ': ' + utils.convertNumToExponential(userStats.exp);
        }
        if (userStats.level > 0) {
            text += '\n' + lexicon.get('LABEL_LEVEL') + ': ' + utils.convertNumToExponential(Math.floor(userStats.level));
        }
        if (userStats.prestige > 0){
            text += '\n' + lexicon.get('LABEL_PRESTIGE') + ': ' + userStats.prestige;
        }

        text += '\n';

        // Level diff bar
        if (userStats.level > 0) {

            var levelDiff = userStats.level - Math.floor(userStats.level);

            text += '\n' + lexicon.get('STATS_LEVEL_PROGRESS', { 
                percentage: (levelDiff * 100).toFixed(2)
            });
            text += '\n';

            for(var ind = 0; ind < barsMaxLength; ind++){
                text += (ind / barsMaxLength < levelDiff) ? '🟩' : '⬜️';
            }            
        }

        // Prestige diff bar
        if (userStats.prestige > 0) {

            var prestigeDiff = userStats.exp / utils.calcExpFromLevel(utils.calcExpGain(userStats.prestige) * 15);

            text += '\n' + lexicon.get('STATS_PRESTIGE_PROGRESS', { 
                percentage: (prestigeDiff * 100).toFixed(2)
            });
            text += '\n';

            for(var ind = 0; ind < barsMaxLength; ind++){
                text += (ind / barsMaxLength < prestigeDiff) ? '🟦' : '⬜️';
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

        // ottiene il riferimento alle stast dell'utente per la chat corrente
        var userStats = user.chats[mexData.chatId]; 

        // Controlla se è spam
        if (!utils.checkifSpam(userStats.lastMessage, mexData.date)) {
            
            // add exp based on prestige power
            var expGain = utils.calcExpGain(userStats.prestige);
            var newExp = userStats.exp + expGain;
            var newLevel = utils.calcLevelFromExp(newExp);

            // notifica l'utente se è salito di livello
            if (Math.floor(userStats.level) < Math.floor(newLevel)) {
                ctx.reply(lexicon.get('USER_LEVELUP', { userName: mexData.userName, level: Math.floor(newLevel) }));
            }

            // notifica l'utente che puo' prestigiare
            if (newLevel >= 15 * expGain && userStats.prestigeAvailable == false) {
                ctx.reply(lexicon.get('USER_PRESTIGE_AVAILABLE', { userName: mexData.userName, level: newLevel }));
                userStats.prestigeAvailable = true;
            }

            // assegna i nuovi dati
            userStats.exp = newExp;
            userStats.level = newLevel;
        }

        userStats.lastMessage = mexData.date;

        return storage.updateUserChatData(mexData.userId, mexData.chatId, userStats);
    });

    bot.on('callback_query', function(ctx){ 
        var query = ctx.update.callback_query;
        var markupData = markup.getData(query.data);

        console.log(query);
        console.log(markupData);
        console.log(bot.telegram);

        return;

        switch(markupData.action){

            case 'SETTING_START': 
                ctx.editMessageText(markupData.text, markupData.buttons).catch(utils.errorlog);
                break;

            case 'SETTING_NOTIFY_LEVELUP': 
                ctx.editMessageText(markupData.text, markupData.buttons).catch(utils.errorlog);
                break;

            case 'SETTING_NOTIFY_PRESTIGE_AVAILABLE':
                ctx.editMessageText(markupData.text, markupData.buttons).catch(utils.errorlog);
                break;
        }

        console.log(bot.telegram)
        console.log(ctx)
        console.log(query);
        console.log(markupData);
    });
    
    console.log("  - loaded bot general events");
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