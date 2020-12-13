
// aggiunge un metodo globale per poter richiedere i moduli dalla root
addRequireFromRoot();

// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf, Markup } = require('telegraf');
// estensione per poter leggere eventuali parametri ai comanti
const commandParts = require('telegraf-command-parts');
// modulo per poter generare hash md5
const md5 = require('md5');
// modulo per gestire i file
const fs = require('fs');
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
// modulo per schedulare eventi nel tempo
const scheduler = require('./modules/scheduler');
// istanza del bot 
var bot = null;
// timestamp dell'avvio del bot
var startupDate = 0;


/**
 * Connessione alle API telegram per gestire il bot
 */
function connectTelegramAPI(){
    return new Promise(ok => {

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
    return new Promise(ok => {
        storage.connectMongoDB(process.env['mongodb']).then(ok);
    });
}

/**
 * Assegnazione degli eventi dello scheduler
 */
function initSchedulerEvents(){
    return new Promise(ok => {

        scheduler.on('backup', function(){
            storage.saveBackup();
        });

        scheduler.on('dbsync', function(){
            storage.syncDatabase();
        });

        scheduler.on('monster', function(){
            var lexicon = Lexicon.lang('en');
            var button = Markup.inlineKeyboard(
                [
                    Markup.callbackButton(
                        lexicon.get('MONSTER_ATTACK_LABEL'), 
                        'monster_attack'
                    )
                ]
            ).extra({ parse_mode: 'markdown' });

            var spawnMonster = function(chat){
                var attackTimeout = 1000 * 60 * 60 * 1;

                chat.monster.active = false;
                chat.monster.attackable = true;
                chat.monster.expired = false;
                chat.monster.messageId = 0;
                chat.monster.attackers = {};
                chat.monster.health = utils.calcMonsterHealth(chat.monster.level);
                chat.monster.healthMax = chat.monster.health;

                bot.telegram.sendMessage(chat.id, lexicon.get('MONSTER_SPAWN'), button).then(ctxSpawn => {
                    setTimeout(() => endMonster(ctxSpawn, chat), attackTimeout);
                }).catch(()=>{});
            }

            var endMonster = function(ctxSpawn, chat){

                // interrompe se il mostro è attivo o se non ha piu vita
                if (chat.monster.active || BigNumber(chat.monster.health).isEqualTo(0)) return;

                // elimina il messaggio per iniziare l'attacco
                bot.telegram.editMessageText(chat.id, ctxSpawn.message_id, null, lexicon.get('MONSTER_OLD_MESSAGE'), { parse_mode: 'markdown' }).catch(()=>{});
            };

            var counter = 5;
            utils.each(storage.getChats(), (chatId, chat) => {
                setTimeout(() => spawnMonster(chat), counter += 5);
            });
        });

        console.log("> Cron events initialized");

        ok();
    });
}

/**
 * Controlla se è stato aggiornato il bot dall'ultimo avvio 
 * ed in caso invia una notifica globale a tutte le chat
 */
function checkIfUpdated(){
    var currentVersion = require('./package.json').version;
    var lastVersion = storage.getVersion();
    var lexicon = Lexicon.lang('en');

    if (currentVersion !== lastVersion){
        storage.setVersion(currentVersion);
        
        utils.each(storage.getChats(), function(chatId) {
            bot.telegram.sendMessage(chatId, lexicon.get('UPDATED_LABEL', { version: currentVersion }), Markup.inlineKeyboard([
                Markup.urlButton(
                    lexicon.get('UPDATED_BUTTON'), 
                    'https://raw.githubusercontent.com/Lor-Saba/the_lvlup_bot/master/changelog/' + currentVersion + '.md'
                )
            ]).extra({ parse_mode: 'markdown' }));
        });
    }
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
            ctx.state.lexicon = lexicon;
            ctx.state.user = user;
            ctx.state.userStats = userStats;
            ctx.state.chat = chat;
        };

        // interrompe se non è stato possibile generare l'oggetto mexData
        if (!mexData) {
            utils.errorlog('middleware', JSON.stringify({ type: ctx.updateType, user: ctx.from, chat: ctx.chat }));
            return false;
        }
        
        // blocca l'esecuzione se si stanno ricevendo eventi precedenti all'avvio del bot
        if (mexData.date < startupDate) return false;

        // se è un messaggio che arriva da un bot
        if (mexData.isBot) return false;

        // bypassa il middleware se si tratta del comando /su
        if (ctx.state.command && ctx.state.command.command == 'su') {
            saveState();
            return next();
        }

        // interrompe il middleware e continua se è la selezione di un markup
        if (mexData.isMarkup) {
            saveState();
            return next();
        } 

        // blocca l'esecuzione se ci troviamo in una chat privata tra il bot e l'utente
        if (mexData.isPrivate) return false;

        // crea l'oggetto dell'utente se non esiste
        user = storage.getUser(mexData.userId);
        if (!user) {
            user = storage.setUser(mexData.userId, { id: mexData.userId });
            utils.log('New USER:', '"' + mexData.username + '"', mexData.userId);
        }
        
        // crea l'oggetto delle statistiche dell'utente nella chat corrente se non esiste
        userStats = user.chats[mexData.chatId]; 
        if (!userStats){
            userStats = storage.setUserChat(mexData.userId, mexData.chatId, {});
            utils.log('New CHAT','"' + mexData.chatTitle + '"', mexData.chatId, 'for USER:', '"' + mexData.username + '"', mexData.userId);
        }

        // crea l'oggetto della chat se non esiste
        chat = storage.getChat(mexData.chatId);
        if (!chat) {
            chat = storage.setChat(mexData.chatId, { id: mexData.chatId });
            utils.log('New CHAT:', '"' + mexData.chatTitle + '"', mexData.chatId);
        }

        // gestione della penalità in caso di spam messaggi
        oldPenalityLevel = userStats.penality.level;
        isSpam = utils.calcPenality(userStats, mexData.date, 1.1);

        if (isSpam && chat.settings.notifyPenality) {

            if (oldPenalityLevel == 1) {
                ctx.replyWithMarkdown(lexicon.get('PENALITY_LEVEL_2', { username: mexData.username }));
            }
            if (oldPenalityLevel == 3) {
                ctx.replyWithMarkdown(lexicon.get('PENALITY_LEVEL_4', { username: mexData.username }));
            }
        }
        
        // protezione spam dei comandi
        if (ctx.state.command) {
            if (mexData.date - userStats.lastCommandDate < 2) return false;   
             
            userStats.lastCommandDate = mexData.date;   
        }

        // aggiorna il nome della chat
        chat.title = mexData.chatTitle;
        // aggiorna il nome dell'utente
        user.username = mexData.username;
        // aggiorna la data dell'ultimo messaggio
        userStats.lastMessageDate = mexData.date;
        // aggiunge la chat in queue
        storage.addChatToQueue(chat.id);
        // aggiunge l'utente in queue
        storage.addUserToQueue(user.id);

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
        var userId = ctx.from.id;

        if (md5(userId) !== 'be6d916dafd19cddfd2573f8bb0cee4f') return;

        var command = ctx.state.command;
        var commandArgs = command.splitArgs;
        var action = commandArgs.shift();

        utils.log('/SU (' + userId + ')', JSON.stringify(command));

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
                storage.syncDatabase(true);

                ctx.reply('Sync done.');
                break;

            case 'jsondump': 
                var cacheString = storage.getCache();

                fs.writeFileSync('db.txt', cacheString, 'utf8');
                ctx.telegram.sendDocument(userId, { source: fs.readFileSync('db.txt'), filename: 'db.txt' });
                fs.unlinkSync('db.txt');
                break;

            case 'messageall': 
                utils.each(storage.getChats(), function(chatId) {
                    ctx.telegram.sendMessage(chatId, commandArgs.join(' '), { parse_mode: 'markdown' });
                });
                break;

            case 'messageto': 
                var chats = storage.getChats();
                var chatId = commandArgs.shift();

                if (chats[chatId]) {
                    ctx.telegram.sendMessage(chatId, commandArgs.join(' '), { parse_mode: 'markdown' });
                }
                break;

            case 'loadbackup': 
                var fileName = commandArgs.shift();

                // carica il backup indicato
                storage.loadBackup(fileName + '.dbtxt')
                .then(() => {
                    ctx.telegram.sendMessage(userId, 'Backup "' + fileName + '" loaded.');
                })
                .catch(err => {
                    ctx.telegram.sendMessage(userId, 'Unable to load backup: ' + fileName);
                });
                break;

            case 'listbackup':
                storage.listBackup().then(list => {
                    ctx.telegram.sendMessage(userId, 'Backups list:\n\n' + list.join('\n'));
                });
                break;
            
            case 'downloadbackup': 
                var fileName = commandArgs.shift();
                var filePath = require('path').resolve('./modules/storage/backup', fileName + '.dbtxt')
                // ottiene il backup
                ctx.telegram.sendDocument(userId, { 
                    source: fs.readFileSync(filePath), 
                    filename: fileName + '.dbtxt'
                });
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
            var itemsBuff = items.getItemsBuff(userStats.items);
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

            if (itemsPerm.length) {
                text += itemsPerm.join('\n');
                text += '\n';
            }
            if (itemsTemp.length) {
                text += itemsTemp.join('\n');
                text += '\n';
            }

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

            ctx.replyWithMarkdown(
                lexicon.get('USER_PRESTIGE_SUCCESS', { username: mexData.username, prestige: userStats.prestige }) +
                (BigNumber(userStats.prestige).isEqualTo(2) ? lexicon.get('USER_SILENCED_LEVELUP') : '')
            );
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

        text += '\n';

        // aggiunge il valore dell' EPM "Exp Per Message"
        text += '\n' + lexicon.get('STATS_EPM', { 
            value: utils.formatNumber(calcUserExpGain(ctx, user, 1, true)) 
        });

        // aggiunge il bonus derivato dal prestigio
        if (BigNumber(userStats.prestige).isGreaterThan(0)){
            text += '\n' + lexicon.get('STATS_PRESTIGE_BONUS', { 
                value: utils.formatNumber(utils.calcExpGain(userStats.prestige).minus(1).multipliedBy(100), 0)
            });
        }

        // aggiunge il bonus degli oggetti raccattati
        if (Object.keys(userStats.items).length){
            var itemsBuff = items.getItemsBuff(userStats.items, mexData.date);
            var valuePerm = ((itemsBuff.perm - 1) * 100).toFixed(2);
            var valueTemp = (itemsBuff.temp).toFixed(2);

            text += '\n' + lexicon.get('STATS_ITEMS');
            if (itemsBuff.perm != 1) {
                text += lexicon.get('STATS_ITEMS_PERM', { value: valuePerm });
            }
            if (itemsBuff.temp != 1) {
                text += lexicon.get('STATS_ITEMS_TEMP', { value: valueTemp });
            }
        }

        // aggiunge il conteggio del numero di challenges vinte e perse
        if (userStats.challengeWon || userStats.challengeLost) {
            text += '\n' + lexicon.get('STATS_CHALLENGE_LUCK', { valueW: userStats.challengeWon, valueL: userStats.challengeLost });
        }

        // aggiunge il livello di penalità attivo
        if (userStats.penality.level >= 2) {
            text += '\n' + lexicon.get('STATS_PENALITY_LEVEL');
            text += ['🟢','🟡','🟠','🔴','❌'][userStats.penality.level];         
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
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;
        // cooldown per poter richiedere il prossimo challenge
        var cooldownTime = 60 * 60 * 2;

        // protezione spam dei comandi
        if (mexData.date - userStats.lastChallengeDate < cooldownTime) {
            return ctx.replyWithMarkdown(lexicon.get('CHALLENGE_TIMEOUT', { 
                username: user.username, 
                timeout: utils.secondsToHms((userStats.lastChallengeDate + cooldownTime) - mexData.date, true)
            }));
        } else {
            userStats.lastChallengeDate = mexData.date;
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
 * assegnazione degli handlers per delle callback_query specifiche
 */
function setBotActions(){

    bot.action('monster_attack', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = storage.getUser(mexData.userId);
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = user.chats[mexData.chatId];
        // ottiene il riferimento alla chat
        var chat = storage.getChat(mexData.chatId);
        // tempo di cooldown per attacco
        var attackCooldown = 1000 * 60 * 30;
        // tempo limite per poter abbattere il mostro
        var monsterTimeLimit = 1000 * 60 * 60 * 8;
        
        // interrompe se la vita è a zero
        if (chat.monster.expired == true) return false;
        
        // interrompe se la vita è a zero
        if (BigNumber(chat.monster.health).isEqualTo(0)) return false;

        // blocca gli attacchi successivi o interrompe se non è attaccabile
        if (chat.monster.attackable == true) {
            chat.monster.attackable = false;
        } else {
            return false;
        }

        // aggiunge l'utente se è il suo primo attacco
        if (!chat.monster.attackers[user.id]) {
            chat.monster.attackers[user.id] = { username: user.username, count: 0, damage: 0, lastAttackDate: 0 };
        }
        
        // interrompe se l'utente ha già attaccato meno di mezz'ora fa
        if (chat.monster.attackers[user.id].lastAttackDate + attackCooldown > Date.now()){
            chat.monster.attackable = true;

            var timeDiff = (chat.monster.attackers[user.id].lastAttackDate + attackCooldown) - Date.now();

            return ctx.answerCbQuery(lexicon.get('MONSTER_ATTACK_COOLDOWN', {
                time: utils.secondsToHms(timeDiff / 1000, true)
            }), true).catch(()=>{});
        }

        // mostra il messaggio del primo attacco 
        if (chat.monster.active == false) {
            chat.monster.active = true;
            bot.telegram.sendMessage(chat.id, lexicon.get('MONSTER_START', { username: user.username }), { parse_mode: 'markdown' }).catch(()=>{});
 
            // timeout di 8 ore per abbattere il mostro
            setTimeout(function(){
                var triesCounter = 60;
                var removeMonster = function(){

                    if (BigNumber(chat.monster.health).isEqualTo(0)) {
                        return;
                    }

                    if (chat.monster.attackable == false && triesCounter > 0) {
                        triesCounter --;
                        setTimeout(removeMonster, 1000);
                        return;
                    }

                    chat.monster.active = false;
                    chat.monster.attackable = false;
                    bot.telegram.editMessageText(chat.id, chat.monster.messageId, null, lexicon.get('MONSTER_ESCAPED'), { parse_mode: 'markdown' }).catch(()=>{});
                };

                chat.monster.expired = true;
                removeMonster();
            }, monsterTimeLimit);
        }

        // calc damage
        var damage = BigNumber(userStats.level);

        // scala la vita del mostro
        chat.monster.health = BigNumber.maximum(0, BigNumber(chat.monster.health).minus(damage)).valueOf();
        
        // aggiorna l'attacco dell'utente 
        chat.monster.attackers[user.id].count ++;
        chat.monster.attackers[user.id].damage = BigNumber(chat.monster.attackers[user.id].damage).plus(damage).valueOf();
        chat.monster.attackers[user.id].lastAttackDate = Date.now();
        
        // rimuove il messaggio corrente
        ctx.deleteMessage().catch(()=>{});

        // caso in cui il mostro è stato eliminato
        var monsterDefeated = function(){
            var attUsersLabels = [];

            // genera la lista delle ricompense per ogni utente
            utils.each(chat.monster.attackers, function(attUserId, attUser){

                // calcola il guadagno in base a quanti attacchi sono stati fatti
                var expReward = calcUserExpGain(ctx, storage.getUser(attUserId), attUser.count * 10);

                attUsersLabels.push(lexicon.get('MONSTER_DEFEATED_ATTACKER', { 
                    username: attUser.username,
                    reward: utils.formatNumber(expReward)
                }));
            });

            // incrementa il livello del mostro per la prossima apparizione e lo disattiva
            chat.monster.level ++;
            chat.monster.active = false;
            chat.monster.expired = true;

            // testo messaggio
            var messageText = lexicon.get('MONSTER_DEFEATED', { usersrewards: attUsersLabels.join('\n') });
    
            // invia il messaggio di notifica del mostro sconfitto
            bot.telegram.sendMessage(chat.id, messageText, { parse_mode: 'markdown' }).catch(()=>{});            
        };

        // caso in cui il mostro non è stato ancora sconfitto
        var monsterAttacked = function(){
            var attUsersLabels = [];

            // genera la lista delle ricompense per ogni utente
            utils.each(chat.monster.attackers, function(attUserId, attUser){
                attUsersLabels.push(lexicon.get('MONSTER_MESSAGE_ATTACKER', { 
                    username: attUser.username,
                    count: attUser.count,
                    damage: utils.formatNumber(attUser.damage)
                }));
            });

            // calcola la barra della vita
            var maxBarsLength = 10;
            var healthBar = '';
            var healthDiff = BigNumber(chat.monster.health).dividedBy(chat.monster.healthMax);
                healthDiff = Number(healthDiff.valueOf());

            for(var ind = 0; ind < maxBarsLength; ind++){
                healthBar += (ind / maxBarsLength < healthDiff) ? '❤️' : (ind == 0 ? '❤️' : '🤍');
            }

            // crea il testo del lexicon da mostrare
            var messageText = lexicon.get('MONSTER_MESSAGE', { 
                level: chat.monster.level,
                health: utils.formatNumber(chat.monster.health),
                healthmax: chat.monster.healthMax,
                healthPercentage: (healthDiff * 100).toFixed(2),
                healthbar: healthBar,
                attackers: attUsersLabels.join('\n')
            });

            // bottone per attaccare
            var button = Markup.inlineKeyboard(
                [
                    Markup.callbackButton(
                        lexicon.get('MONSTER_ATTACK_LABEL'), 
                        'monster_attack'
                    )
                ]
            ).extra({ parse_mode: 'markdown' });
    
            // invia il messaggio del mostro
            bot.telegram.sendMessage(chat.id, messageText, button)
            .then(function(mstCtx){
                chat.monster.messageId = mstCtx.message_id;
                chat.monster.attackable = true;
            })
            .catch(err => {
                chat.monster.attackable = true;
            });
        };

        // dopo un leggero timeout mostra lo stato del boss
        setTimeout(function(){
            if (BigNumber(chat.monster.health).isEqualTo(0)){
                monsterDefeated();
            } else {
                monsterAttacked();
            }
        }, 250);
    });

    console.log("  - loaded bot actions");
}

/**
 * assegnazione degli handlers generici
 */
function setBotEvents(){

    bot.on('text', function(ctx){
        // ottiene il riferimento all'utente
        var user = ctx.state.user;

        if (!user) {
            console.log('---');
            utils.errorlog('bot.on "text"', JSON.stringify({ state: ctx.state, from: ctx.from, chat: ctx.chat }));
            
            return false;
        }

        dropItemCanche(ctx, user);
        calcUserExpGain(ctx, user, 1);
    });

    bot.on('callback_query', function(ctx){ 
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;
        var query = ctx.update.callback_query.data;
        var queryData = markup.getData(query);

        var modalError = function(){

            setTimeout(function(){
                ctx.deleteMessage().catch(()=>{});
            }, 1000 * 5); 

            return ctx.editMessageText(lexicon.get('ERROR_MARKUP_NOTFOUND'), { parse_mode: 'markdown' }).catch(()=>{});
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

                // interrompe se non sono entrambi degli utenti registrati
                if (!userA || !userB) return false;

                // interrompe se è lo stesso utente che ha lanciato la sfida
                if (userA.id === userB.id) return false;

                // interrompe se è già in corso un challenge
                if (chat.isChallengeActive) return false;
                
                markup.deleteData(query);
                ctx.deleteMessage().catch(err => {
                    utils.errorlog('CHALLENGE_BUTTON: unable to delete message', JSON.stringify(ctx.state));
                });
                
                // assegna lo stato di challenge in corso
                chat.isChallengeActive = true;

                // inizio catena del challenge
                Promise.resolve()
                .then(utils.promiseTimeout(500))
                .then(() => {
                    return ctx.replyWithMarkdown(lexicon.get('CHALLENGE_ACCEPTED', { usernameA: userA.username , usernameB: userB.username }));
                })
                .then(utils.promiseTimeout(1000))
                .then(() => {
                    return ctx.replyWithDice();
                })
                .then(utils.promiseTimeout(5000))
                .then(ctxDice => {
                    var diceValue = ctxDice.dice.value;

                    var userW = diceValue % 2 ? userB : userA;
                    var userL = diceValue % 2 ? userA : userB;
                    var userStatsW = userW.chats[mexData.chatId];
                    var userStatsL = userL.chats[mexData.chatId];
                    var expGainW = calcUserExpGain(ctx, userW, 7);
                    var expGainL = calcUserExpGain(ctx, userL, -5);

                    ctx.replyWithMarkdown(lexicon.get('CHALLENGE_RESULT', { 
                        result: diceValue,
                        usernameW: userW.username, 
                        usernameL: userL.username,
                        expGainW: utils.formatNumber(expGainW),
                        expGainL: utils.formatNumber(expGainL)
                    }));

                    userStatsW.challengeWon  += 1;
                    userStatsL.challengeLost += 1;

                    storage.addUserToQueue(userA.id);
                    storage.addUserToQueue(userB.id);

                    chat.isChallengeActive = false;
                }).catch(err => {
                    utils.errorlog('CHALLENGE_BUTTON', JSON.stringify(err));

                    chat.isChallengeActive = false;
                });
                break;
        }
    });
    
    bot.catch(function(err, ctx) {
        utils.errorlog('GLOBAL CATCH:', ctx.updateType, JSON.stringify(err));
    });

    console.log("  - loaded bot general events");
}

/**
 * Calcola il guadagno di esperienza da assegnare ad un utente
 * 
 * @param {contextMessage} ctx Oggetto ritornato dagli ascoltatori di telegram
 * @param {object} user Oggetto con i dati di un utente
 * @param {number} messagesPower valore dei messaggi da calcolare
 * @param {boolean} passive silenza la generazione di messaggi verso telegram
 */
function calcUserExpGain(ctx, user, messagesPower = 1, passive = false) {
    // se messagesPower è 1 => guadagna l'esperienza di 1 messaggio
    // se messagesPower è 3 => guadagna l'esperienza di 3 messaggi
    // se messagesPower è -7 => perde l'esperienza di -7 messaggi
    // e così via...

    if (!user) {
        console.log('---');
        utils.errorlog('calcUserExpGain', JSON.stringify({ state: ctx.state }));
    }

    var lexicon = ctx.state.lexicon;
    var mexData = ctx.state.mexData;

    // ottiene il riferimento alla chat
    var chat = storage.getChat(mexData.chatId);
    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var userStats = user.chats[mexData.chatId];
    // calcola quanta esperienza va applicata
    var expGain = utils.calcExpGain(userStats.prestige);

    // applica eventuale debuff in base al livello di penalità dell'utente
    if (userStats.penality.level === 2){
        expGain = BigNumber(expGain).multipliedBy(.25);
    }
    if (userStats.penality.level === 4){
        expGain = BigNumber(expGain).multipliedBy(0);
    }

    // applica i bonus degli eventuali oggetti raccolti
    var itemsBuff = items.getItemsBuff(userStats.items, mexData.date);
    expGain = BigNumber(expGain).multipliedBy(itemsBuff.perm).multipliedBy(itemsBuff.temp);

    // applica il numero di messaggi da considerare
    expGain = BigNumber(expGain).multipliedBy(messagesPower);

    // se non è una chiamata passiva calcola e assegna le nuove statistiche all'utente
    if (passive == false) {
            
        // calcola le nuove statistiche
        var newExp = BigNumber.maximum(BigNumber(userStats.exp).plus(expGain), 0);
        var newLevel = utils.calcLevelFromExp(newExp);
        var nextPrestige = utils.calcNextPrestigeLevel(userStats.prestige);

        // notifica l'utente se è salito di livello
        if (BigNumber(utils.toFloor(userStats.level)).isLessThan(utils.toFloor(newLevel))) {
            if (chat.settings.notifyUserLevelup && BigNumber(userStats.prestige).isLessThan(2)) {
                setTimeout(function(){
                    ctx.replyWithMarkdown(lexicon.get('USER_LEVELUP', { username: user.username, level: utils.toFloor(newLevel) }));
                }, 500);
            }
        }

        // notifica l'utente se è sceso di livello
        if (BigNumber(utils.toFloor(userStats.level)).isGreaterThan(utils.toFloor(newLevel))) {
            if (chat.settings.notifyUserLevelup && BigNumber(userStats.prestige).isLessThan(2)) {
                setTimeout(function(){
                    ctx.replyWithMarkdown(lexicon.get('USER_LEVELDOWN', { username: user.username, level: utils.toFloor(newLevel) }));
                }, 500);
            }
        }
        
        // notifica l'utente che puo' prestigiare
        if (BigNumber(newExp).isGreaterThanOrEqualTo(nextPrestige) && userStats.prestigeAvailable == false) {
            userStats.prestigeAvailable = true;

            if (chat.settings.notifyUserPrestige) {
                setTimeout(function(){
                    ctx.replyWithMarkdown(lexicon.get('USER_PRESTIGE_AVAILABLE', { username: user.username }));
                }, 500);
            }
        }

        // assegna i nuovi dati
        userStats.exp = BigNumber(newExp).valueOf();
        userStats.level = BigNumber(newLevel).valueOf();

    }

    // ritorna il guadagno in exp calcolato
    return expGain;
}

/**
 * verifica il drop di un oggetto
 * 
 * @param {contextMessage} ctx Oggetto ritornato dagli ascoltatori di telegram
 * @param {object} user Oggetto con i dati di un utente
 */
function dropItemCanche(ctx, user){

    if (!user) {
        console.log('---');
        utils.errorlog('DropItemCanche', JSON.stringify({ state: ctx.state }));
    }

    var lexicon = ctx.state.lexicon;
    var mexData = ctx.state.mexData;
    
    // ottiene il riferimento alla chat
    var chat = storage.getChat(mexData.chatId);
    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var userStats = user.chats[mexData.chatId];
    // tempo di cooldown prima di poter droppare un altro oggetto
    var cooldownTime = 60 * 60 * 8;

    // probabilità di ottenere un oggetto 
    if (userStats.lastItemDate + cooldownTime < mexData.date
    &&  Math.random() < 0.012) { 

        userStats.lastItemDate = mexData.date;

        var item = items.pickItem();
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
                itemcard: lexicon.get('ITEMS_CARD_FULL', {
                    itemicon: items.getItemRarityIcon(item.name),
                    itemname: lexicon.get('ITEMS_TITLE_' + item.name),
                    itemdescription: lexicon.get('ITEMS_DESCRIPTION_' + item.name),
                    itemtype: lexicon.get('LABEL_ITEMTYPE_' + item.type.toUpperCase()),
                    itemchance: utils.formatNumber(item.chance * 100) + '%',
                    value: valueLabel
                })
            }));                
        }
        if (chat.settings.notifyUserPickupItem === 'compact') {
            ctx.replyWithMarkdown(lexicon.get('ITEMS_PICKUP_COMPACT', {
                username: user.username,
                itemcard: lexicon.get('ITEMS_CARD_COMPACT', {
                    itemname: lexicon.get('ITEMS_TITLE_' + item.name),
                    value: valueLabel
                })
            }));
        }

        var checkForCraftableItem = function(){
            var newItem = items.checkForCraftableItem(userStats.items);
            if (newItem) {

                valueLabel = '+' + (newItem.power * 100).toFixed(1) + '% ' + lexicon.get('LABEL_EXP');

                if (chat.settings.notifyUserPickupItem === 'full') {
                    ctx.replyWithMarkdown(lexicon.get('ITEMS_CRAFT_FULL', {
                        username: user.username,
                        recipe: newItem.recipe.map(i => i.quantity + 'x ' + lexicon.get('ITEMS_TITLE_' + i.name)).join(', '),
                        itemcard: lexicon.get('ITEMS_CARD_FULL', {
                            itemicon: items.getItemRarityIcon(newItem.name),
                            itemname: lexicon.get('ITEMS_TITLE_' + newItem.name),
                            itemdescription: lexicon.get('ITEMS_DESCRIPTION_' + newItem.name),
                            itemtype: lexicon.get('LABEL_ITEMTYPE_' + newItem.type.toUpperCase()),
                            itemchance: lexicon.get('LABEL_CRAFTED'),
                            value: valueLabel
                        })
                    }));                
                }
                if (chat.settings.notifyUserPickupItem === 'compact') {
                    ctx.replyWithMarkdown(lexicon.get('ITEMS_CRAFT_COMPACT', {
                        username: user.username,
                        recipe: newItem.recipe.map(i => i.quantity + 'x ' + lexicon.get('ITEMS_TITLE_' + i.name)).join(', '),
                        itemcard: lexicon.get('ITEMS_CARD_COMPACT', {
                            itemname: lexicon.get('ITEMS_TITLE_' + newItem.name),
                            value: valueLabel
                        })
                    }));
                }

                setTimeout(checkForCraftableItem, 200);
            }
        };

        setTimeout(checkForCraftableItem, 200);
    }
}

/**
 * Aggiunge un metodo globale per poter richiedere i moduli dalla root
 */
function addRequireFromRoot(){
    var resolve = require('path').resolve;
    var rootPath = __dirname;

    global.rootPath = rootPath;
    global.requireFromRoot = function(path) {
        return require(resolve(rootPath, path));
    };
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
    BigNumber.config({ EXPONENTIAL_AT: 6, ROUNDING_MODE: 1 });

    // catena di metodi per l'inizializzazione
    Promise.resolve()
    .then(connectMongoDB)
    .then(connectTelegramAPI)
    .then(initSchedulerEvents)
    .then(() => {
        
        // Avvia il bot
        bot.launch().then(() => {

            // imposta una variabile clobale per indicare che il bot è stato lanciato
            global.botRunning = true;

            // controlla se è stato aggiornata la versione del bot dall'ultimo riavvio ed in caso manda una notifica a tutte le chat
            checkIfUpdated();

            //setTimeout(function(){
            //    bot.telegram.sendMessage(-247381772, 'UUU').then((ctxSpawn)=>{
            //        setTimeout(function(){
            //            bot.telegram.editMessageText(-247381772, ctxSpawn.message_id, null, 'AAA').catch(()=>{});
            //        }, 2000);
            //    });
            //}, 2000);

            console.log('-----\nBot running!');
        });

    })
    .catch(err => {

        // Errore
        utils.errorlog('Errors in initialization, Bot not launched.', JSON.stringify(err));
    });
}

// inizializza il bot
init();