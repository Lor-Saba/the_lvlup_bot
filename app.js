
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
// modulo per gestire il drop degli oggetti 
const items = require('./modules/items');
// modulo per creare immagini con canvas
//const canvas = require('./modules/canvas');
// istanza del bot 
var bot = null;
// timestamp dell'avvio del bot
var startupDate = 0;


/**
 * Connessione alle API telegram per gestire il bot
 */
function connectTelegramAPI(){
    return new Promise(function(ok){

        bot = new Telegraf(process.env["accessToken"]);

        console.log("> Telegram connected");

        setBotMiddlewares();
        setBotCommands();
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

    // parsa i comandi
    bot.use(commandParts());

    // middleware principoale 
    bot.use(function(ctx, next) {

        if (ctx.updateType == 'edited_message') return false;

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
        if (mexData.isBot) return false;

        // interrompe il middleware e continua se è la selezione di un markup
        if (mexData.isMarkup) {
            saveState();
            return next();
        } 
        
        // blocca l'esecuzione se si stanno ricevendo eventi precedenti all'avvio del bot
        if (mexData.date < startupDate) return false;

        // bypassa il middleware se si tratta del comando /su
        if (ctx.state.command && ctx.state.command.command == 'su'){
            return next();
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

            if (isSpam && chat.settings.notifyPenality) {

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

        leaderboard - Check who's the boss of the chat.
        stats - Check your stats in the current chat.
        items - List your picked items.
        prestige - Give up all your exp and levels to gain a prestige! This will let you grow faster.
        challengeme - Drop the glove! challenge others users for more Exp.
        settings - Configure the bot. (Admins only)

    */

    bot.command('su', function(ctx){
        var userId = ctx.update.message.from.id;

        if (md5(userId) !== 'be6d916dafd19cddfd2573f8bb0cee4f') return;

        var command = ctx.state.command;
        var commandArgs = command.splitArgs;
        var action = commandArgs.shift();

        console.log('=====');
        console.log('/SU (' + userId + ')', command);
        console.log('=====');

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
                    ctx.reply('Reset result for user "' + userId + '": ' + result);
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

                ctx.reply('Sync done.');
                break;
        }
    })
    
    bot.command('items', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.replyWithMarkdown(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;
        // testo finale contenente la lista di oggetti
        var text = '';

        // aggiunge il bonus degli oggetti raccattati
        if (Object.keys(userStats.items).length){
            var itemsBuff = items.getItemsBuff(userStats.items, mexData.date);
            var totalPerm = ((itemsBuff.perm - 1) * 100).toFixed(2);
            var totalTemp = (itemsBuff.temp).toFixed(2);
            var itemsPerm = [];
            var itemsTemp = [];

            text += lexicon.get('ITEMS_LIST_TITLE', { username: user.username });
            text += '\n\n';
            
            utils.each(userStats.items, function(key, value){
                var item = items.getItem(key);

                if (item.type === 'perm') {
                    itemsPerm.push(lexicon.get('ITEMS_LIST_ITEM_PERM', { 
                        name: lexicon.get('ITEMS_TITLE_' + key), 
                        value: (item.power * 100).toFixed(1), 
                        quantity: value
                    }));
                }
                if (item.type === 'temp') {
                    itemsTemp.push(lexicon.get('ITEMS_LIST_ITEM_TEMP', { 
                        name: lexicon.get('ITEMS_TITLE_' + key), 
                        value: (item.power).toFixed(1),
                        timeout: utils.secondsToHms(value + ( 60 * 60 * item.timeout) - mexData.date)
                    }));
                }
            });

            text += itemsPerm.join('\n') + '\n' + itemsTemp.join('\n');
            text += '\n';
            text += '\n';

            if (itemsBuff.perm != 1 || itemsBuff.temp != 1) {

                text += lexicon.get('ITEMS_LIST_TOTAL');

                if (itemsBuff.perm != 1) {
                    text += lexicon.get('STATS_ITEMS_PERM', { value: totalPerm });
                }
                if (itemsBuff.temp != 1) {
                    text += lexicon.get('STATS_ITEMS_TEMP', { value: totalTemp });
                }
            }
        } else {
            text += lexicon.get('ITEMS_LIST_NOITEMS', { username: user.username });
        }

        ctx.replyWithMarkdown(text);
    });

    bot.command('settings', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.replyWithMarkdown(lexicon.get('LABEL_GROUPONLY_COMMAND'));
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

                var markupData = markup.get('SETTINGS_START', ctx.update.message, { chatTitle: mexData.chatTitle, chatId: mexData.chatId });

                bot.telegram.sendMessage(mexData.userId, markupData.text, markupData.buttons).catch(() => {});

                return ctx.replyWithMarkdown(lexicon.get('SETTINGS_PRIVATE_MESSAGE_SENT', { username: mexData.username }));
            } else {

                return ctx.replyWithMarkdown(lexicon.get('SETTINGS_NOPERMISSION', { username: mexData.username }));
            }
        });
    });
    
    bot.command('prestige', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.replyWithMarkdown(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }
        
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;

        if (userStats.prestigeAvailable) {
            userStats.exp = '0';
            userStats.level = '0';
            userStats.prestige = BigNumber(userStats.prestige).plus(1).valueOf();
            userStats.prestigeAvailable = false;

            ctx.replyWithMarkdown(lexicon.get('USER_PRESTIGE_SUCCESS', { username: mexData.username, prestige: userStats.prestige }));
        } else {
                
            ctx.replyWithMarkdown(lexicon.get('USER_PRESTIGE_FAIL', { username: mexData.username }));
        }

        return storage.addUserToQueue(mexData.userId);
    });
    
    bot.command('leaderboard', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.replyWithMarkdown(lexicon.get('LABEL_GROUPONLY_COMMAND'));
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
            return ctx.replyWithMarkdown(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;

        // notifica che non è stata ancora raccolto alcuna statistica ed interrompe il comando
        if (BigNumber(userStats.exp).isEqualTo(0) 
        &&  BigNumber(userStats.level).isEqualTo(0) 
        &&  BigNumber(userStats.prestige).isEqualTo(0)) {
            return ctx.replyWithMarkdown(lexicon.get('STATS_NOUSER', { username: mexData.username }));
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
            else text += '   ' + (leaderboardPosition + 1) + '°';

            text += '\n';
        }

        // agiunge le statistiche basi: Exp, Level, Prestige
        if (BigNumber(userStats.exp).isGreaterThan(0)) {
            text += '\n' + lexicon.get('STATS_LABEL_EXP', { value: utils.formatNumber(userStats.exp) });
        }
        if (BigNumber(userStats.level).isGreaterThan(0)) {
            text += '\n' + lexicon.get('STATS_LABEL_LEVEL', { value: utils.formatNumber(utils.toFloor(userStats.level), 0)});
        }
        if (BigNumber(userStats.prestige).isGreaterThan(0)){
            text += '\n' + lexicon.get('STATS_LABEL_PRESTIGE', { value: utils.formatNumber(userStats.prestige, 0)});
        }

        // aggiunge il bonus degli oggetti raccattati
        if (Object.keys(userStats.items).length){
            var itemsBuff = items.getItemsBuff(userStats.items, mexData.date);
            var valuePerm = ((itemsBuff.perm - 1) * 100).toFixed(2);
            var valueTemp = (itemsBuff.temp).toFixed(2);

            text += '\n';
            text += '\n' + lexicon.get('STATS_ITEMS');
            if (itemsBuff.perm != 1) {
                text += lexicon.get('STATS_ITEMS_PERM', { value: valuePerm });
            }
            if (itemsBuff.temp != 1) {
                text += lexicon.get('STATS_ITEMS_TEMP', { value: valueTemp });
            }
        }

        // aggiunge il livello di penalità attivo
        if (user.penality.level >= 2) {
            text += '\n';
            text += '\n' + lexicon.get('STATS_PENALITY_LEVEL');
            text += ['🟢','🟡','🟠','🔴','❌'][user.penality.level];         
        }

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

            var prestigeDiff = BigNumber(userStats.exp).dividedBy(utils.calcNextPrestigeLevel(userStats.prestige));
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

    bot.command('challengeme', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        if (mexData.isPrivate) {
            return ctx.replyWithMarkdown(lexicon.get('LABEL_GROUPONLY_COMMAND'));
        }

        // ottiene il riferimento all'utente
        var user = ctx.state.user;

        // protezione spam dei comandi
        if (mexData.date - user.lastChallengeDate < 60 * 5) {
            return ctx.replyWithMarkdown(lexicon.get('CHALLENGE_TIMEOUT', { 
                username: user.username, 
                timeout: (user.lastChallengeDate + 60 * 5) - mexData.date
            }));
        } else {
            user.lastChallengeDate = mexData.date;
        }

        var markupData = markup.get('CHALLENGE_START', ctx.update.message, { 
            username: mexData.username, 
            userId: mexData.userId, 
            chatId: mexData.chatId 
        });

        bot.telegram.sendMessage(mexData.chatId, markupData.text, markupData.buttons).catch(() => {});
    });

    console.log("  - loaded bot commands");
}

/**
 * assegnazione degli handlers generici
 */
function setBotEvents(){

    bot.on('message', function(ctx){
        var mexData = ctx.state.mexData;

        // esce se non è un messaggio scritto 
        if (mexData.isPrivate) return;

        // ottiene il riferimento all'utente
        var user = ctx.state.user;

        calcUserExpGain(ctx, user, 1);

        user.lastMessageDate = mexData.date;
    });

    bot.on('callback_query', function(ctx){ 
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;
        var query = ctx.update.callback_query.data;
        var queryData = markup.getData(query);

        var modalError = function(){

            setTimeout(function(){
                ctx.deleteMessage();
            }, 1000 * 5); 

            return ctx.editMessageText(lexicon.get('ERROR_MARKUP_NOTFOUND'), { parse_mode: 'markdown' });
        }

        if (!queryData) return modalError();

        switch(queryData.action){

            case 'SETTINGS_START': 
                var markupData = markup.get(queryData.action, mexData.message, { 
                    chatTitle: queryData.chatTitle, 
                    chatId: queryData.chatId 
                });
                
                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                break;

            case 'SETTINGS_NOTIFY_PENALITY':
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return modalError();

                if (queryData.value !== undefined) {
                    chat.settings.notifyPenality = queryData.value;
                }

                var markupData = markup.get(queryData.action, mexData.message, { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyPenality 
                });
                
                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                storage.addChatToQueue(chat.id);
                break;

            case 'SETTINGS_NOTIFY_LEVELUP': 
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return modalError();

                if (queryData.value !== undefined) {
                    chat.settings.notifyUserLevelup = queryData.value;
                }

                var markupData = markup.get(queryData.action, mexData.message, { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyUserLevelup 
                });

                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                storage.addChatToQueue(chat.id);
                break;

            case 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE':
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return modalError();

                if (queryData.value !== undefined) {
                    chat.settings.notifyUserPrestige = queryData.value;
                }

                var markupData = markup.get(queryData.action, mexData.message, { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyUserPrestige 
                });

                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                storage.addChatToQueue(chat.id);
                break;

            case 'SETTINGS_NOTIFY_ITEM_PICKUP':
                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return modalError();

                if (queryData.value !== undefined) {
                    chat.settings.notifyUserPickupItem = queryData.value;
                }

                var markupData = markup.get(queryData.action, mexData.message, { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    value: chat.settings.notifyUserPickupItem 
                });

                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                storage.addChatToQueue(chat.id);
                break;

            case 'CHALLENGE_BUTTON': 
                var chat  = storage.getChat(mexData.chatId);
                var userA = storage.getUser(queryData.userId);
                var userB = storage.getUser(mexData.userId);

                // interrompe se non sono entrambi degli utenti resistenti
                if (!userA || !userB) return modalError();

                // interrompe se è lo stesso utente che ha lanciato la sfida
                if (userA.id === userB.id) return false;

                // interrompe se è già in corso un challenge
                if (chat.isChallengeActive) return false;
                
                markup.deleteData(query);
                ctx.deleteMessage();

                // timeout concatenabile alla catena di promesse
                var promiseTimeout = function(timeout){
                    return arg => { return new Promise(ok => {
                        setTimeout(() => ok(arg), timeout);
                    }) };
                };

                // inizio catena del challenge
                Promise.resolve()
                .then(() => {
                    chat.isChallengeActive = true;
                    return ctx.replyWithMarkdown(lexicon.get('CHALLENGE_ACCEPTED', { usernameA: userA.username , usernameB: userB.username }));
                })
                .then(promiseTimeout(1000))
                .then(() => {
                    return ctx.replyWithDice();
                })
                .then(promiseTimeout(5000))
                .then(ctxDice => {
                    var diceValue = ctxDice.dice.value;

                    var userW = diceValue % 2 ? userB : userA;
                    var userL = diceValue % 2 ? userA : userB;
                    var expGainW = calcUserExpGain(ctx, userW, 15, true);
                    var expGainL = calcUserExpGain(ctx, userL, -15, true);

                    ctx.replyWithMarkdown(lexicon.get('CHALLENGE_RESULT', { 
                        result: diceValue,
                        usernameW: userW.username, 
                        usernameL: userL.username,
                        expGainW: utils.formatNumber(expGainW),
                        expGainL: utils.formatNumber(expGainL)
                    }));

                    storage.addUserToQueue(userA.id);
                    storage.addUserToQueue(userB.id);

                    chat.isChallengeActive = false;
                }).catch(err => {
                    chat.isChallengeActive = false;
                });
                break;
        }
    });
    
    var calcUserExpGain = function(ctx, user, messagesPower = 1, passive = false) {
        // se messagesPower è 1 => guadagna l'esperienza di 1 messaggio
        // se messagesPower è 3 => guadagna l'esperienza di 3 messaggi
        // se messagesPower è -7 => perde l'esperienza di -7 messaggi
        // e così via...

        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        // ottiene il riferimento alla chat
        var chat = storage.getChat(mexData.chatId);
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = user.chats[mexData.chatId];
        // calcola quanta esperienza va applicata
        var expGain = utils.calcExpGain(userStats.prestige);

        // applica eventuale debuff in base al livello di penalità dell'utente
        if (user.penality.level === 2){
            expGain = BigNumber(expGain).multipliedBy(.25);
        }
        if (user.penality.level === 4){
            expGain = BigNumber(expGain).multipliedBy(0);
        }

        // probabilità di ottenere un oggetto 
        if (user.lastItemDate + (60 * 60 * 4) < mexData.date    // tempo minimo di 4 ore tra ogni drop
        &&  Math.random() < 0.0175                              // probabilità dell' 1.75%
        &&  passive == false) { 

            user.lastItemDate = mexData.date;

            var item = items.pick();
            var hasItem = userStats.items[item.name];
            var valueLabel = '';

            if (item.type === 'inst') {
                var bonusExpGain = calcUserExpGain(ctx, user, item.messages, true);

                valueLabel = '+' + utils.formatNumber(bonusExpGain) + ' ' + lexicon.get('LABEL_EXP');
            }
            if (item.type === 'temp') {
                userStats.items[item.name] = mexData.date;

                valueLabel = (item.power > 1 ? '+': '') + utils.formatNumber((item.power - 1) * 100, 0) + '% ' + lexicon.get('LABEL_EXP') + ' (' + item.timeout + 'h) ';
            }
            if (item.type === 'perm') {
                if (hasItem) {
                    userStats.items[item.name]++;
                } else {
                    userStats.items[item.name] = 1;
                }

                valueLabel = '+' + (item.power * 100).toFixed(1) + '% ' + lexicon.get('LABEL_EXP');
            }

            if (chat.settings.notifyUserPickupItem === 'full') {
                ctx.replyWithMarkdown(lexicon.get('ITEMS_PICKUP_FULL', {
                    username: user.username,
                    itemicon: items.getRarityIcon(item.name),
                    itemname: lexicon.get('ITEMS_TITLE_' + item.name),
                    itemdescription: lexicon.get('ITEMS_DESCRIPTION_' + item.name),
                    value: valueLabel
                }));                
            }
            if (chat.settings.notifyUserPickupItem === 'compact') {
                ctx.replyWithMarkdown(lexicon.get('ITEMS_PICKUP_COMPACT', {
                    username: user.username,
                    itemname: lexicon.get('ITEMS_TITLE_' + item.name),
                    value: valueLabel
                }));
            }
        }

        // applica i bonus degli eventuali oggetti raccolti
        var itemsBuff = items.getItemsBuff(userStats.items, mexData.date);
        expGain = BigNumber(expGain).multipliedBy(itemsBuff.perm).multipliedBy(itemsBuff.temp);

        // applica il numero di messaggi da considerare
        expGain = BigNumber(expGain).multipliedBy(messagesPower);

        // calcola le nuove statistiche
        var newExp = BigNumber.maximum(BigNumber(userStats.exp).plus(expGain), 0);
        var newLevel = utils.calcLevelFromExp(newExp);
        var nextPrestige = utils.calcNextPrestigeLevel(userStats.prestige);

        // notifica l'utente se è salito di livello
        if (BigNumber(utils.toFloor(userStats.level)).isLessThan(utils.toFloor(newLevel))) {
            if (chat.settings.notifyUserLevelup && passive == false) {
                ctx.replyWithMarkdown(lexicon.get('USER_LEVELUP', { username: user.username, level: utils.toFloor(newLevel) }));
            }
        }

        // notifica l'utente se è sceso di livello
        if (BigNumber(utils.toFloor(userStats.level)).isGreaterThan(utils.toFloor(newLevel))) {
            if (chat.settings.notifyUserLevelup && passive == false) {
                ctx.replyWithMarkdown(lexicon.get('USER_LEVELDOWN', { username: user.username, level: utils.toFloor(newLevel) }));
            }
        }
        
        // notifica l'utente che puo' prestigiare
        if (BigNumber(newExp).isGreaterThanOrEqualTo(nextPrestige) && userStats.prestigeAvailable == false) {
            userStats.prestigeAvailable = true;

            if (chat.settings.notifyUserPrestige && passive == false) {
                ctx.replyWithMarkdown(lexicon.get('USER_PRESTIGE_AVAILABLE', { username: user.username, level: utils.toFloor(newLevel) }));
            }
        }

        // assegna i nuovi dati
        userStats.exp = BigNumber(newExp).valueOf();
        userStats.level = BigNumber(newLevel).valueOf();

        // ritorna il guadagno in exp calcolato
        return expGain;
    }

    console.log("  - loaded bot general events");
}

/**
 * Metodo di partenza per avviare il bot
 */
function init(){
    // clear console log 
    console.clear();

    // salva la data di avvio del processo
    startupDate = Date.now() / 1000;

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