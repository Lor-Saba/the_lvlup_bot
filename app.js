
// aggiunge un metodo globale per poter richiedere i moduli dalla root
addRequireFromRoot();

// configurazione di sviluppo
const dotenv = require('dotenv').config();
// corelib per le api di telegram
const { Telegraf, Markup } = require('telegraf');
// estensione per poter leggere eventuali parametri ai comanti
const commandParts = require('telegraf-command-parts');
// modulo per gestire i file
const fs = require('fs');
// modulo per crittografare stringhe
const Cryptr = require('cryptr');
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
// modulo per gestire l'evento del mostro
const monsters = require('./modules/monsters');
// modulo per gestire l'evento del dungeon
const dungeons = require('./modules/dungeon');
// modulo per gestire l'evento dei riddles
const riddles = require('./modules/riddles');
// modulo per gestire i messaggi
//const messages = require('./modules/messages');
// modulo per gestire la parte web site
const site = require('./modules/site');
// istanza del bot 
var bot = null;
// timestamp dell'avvio del bot
var startupDate = 0;
// istanza per crittografare
const cryptr = new Cryptr(process.env['cryptrkey']);


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
 * Assegnazione ed inizializzazione routing pagine web del bot
 */
function startSite(){
    return new Promise(ok => {
        site.on('dungeon', {
            get: function(params, route){
                console.log('site::dungeon');

                return {
                    chatId: params.chatId,
                    userId: params.userId,
                    dungeonEnabled: true
                };
            }
        });

        site.on('leaderboard', {
            get: function(params, route){
                console.log('site::leaderboard');

                return {
                    chatId: params.chatId
                };
            }
        });

        site.on('mystats', {
            get: function(params, route){
                var chatId = cryptr.decrypt(params.chatId);
                var userId = cryptr.decrypt(params.userId);
                var user = storage.getUser(userId);
                var chat = storage.getChat(chatId);
                var userStats = user.chats[chatId];
                var lexicon = Lexicon.lang('en');
                var ctx = { state: { lexicon: lexicon, mexData: { chatId: chatId } } };

                if (!user) return false;
                if (!userStats) return false;

                var templateData = {
                    username: user.username,
                    chatId: params.chatId,
                    userId: params.userId,
                    penalityLevel: userStats.penality.level // ['🟢','🟡','🟠','🔴','❌']
                };

                var getStatsData = function(){

                    var data = {
                        hasExp: BigNumber(userStats.exp).isGreaterThan(0),
                        hasLevel: BigNumber(userStats.level).isGreaterThan(0),
                        hasPrestige: BigNumber(userStats.prestige).isGreaterThan(0),
    
                        exp: utils.formatNumber(userStats.exp, 6),
                        level: utils.formatNumber(utils.toFloor(userStats.level), 0),
                        prestige: utils.formatNumber(userStats.prestige, 0),
    
                        prestigeAvailable: userStats.prestigeAvailable,
                        expPerMessage: utils.formatNumber(calcUserExpGain(ctx, user, 1, true)),
                        prestigeBonus: utils.formatNumber(utils.calcExpGain(userStats.prestige).minus(1).multipliedBy(100), 0),
    
                        itemsBuff: []
                    };

                    // non è stata ancora raccolto alcuna statistica ed interrompe il comando
                    if (BigNumber(userStats.exp).isEqualTo(0) 
                    &&  BigNumber(userStats.level).isEqualTo(0) 
                    &&  BigNumber(userStats.prestige).isEqualTo(0)) {} 
                    else {
                        data.hasStats = true;
                    }
                    
                    // aggiunge il bonus degli oggetti raccattati
                    if (Object.keys(userStats.items).length){
                        
                        var itemsBuff = items.getItemsBuff(userStats.items);
    
                        utils.each(itemsBuff, function(target, value){
                            var buff = value - 1;
                            if (buff === 0) return;
    
                            data.itemsBuff.push({ 
                                target: lexicon.get('ITEMS_LIST_TARGET_' + target.toUpperCase()),
                                value: (buff >= 0 ? '+' : '') + (buff * 100).toFixed(2) + '%'
                            });
                        });
                    }
    
                    // aggiunge il conteggio del numero di challenges vinte e perse
                    if (userStats.challengeWonTotal || userStats.challengeLostTotal) {
                        data.hasChallenges = true;
                        data.challengesWon = userStats.challengeWonTotal;
                        data.challengesLost = userStats.challengeLostTotal;
                        data.challengesRateo = (Number(userStats.challengeWonTotal) / (Number(userStats.challengeLostTotal) || 1)).toFixed(2);
                    }

                    // aggiunge la chance di drop
                    var chatItemsBuff = items.getItemsBuff(chat.items);
                    var dropCooldownTime = (60 * 60 * 8) * chatItemsBuff.drop_cd;
                    data.drop = {
                        cooldownTime: userStats.lastItemDate + dropCooldownTime - (Date.now() / 1000),
                        cooldownActive: userStats.lastItemDate + dropCooldownTime >= (Date.now() / 1000),
                        chance: ((0.015 + userStats.itemsDropGrow) * chatItemsBuff.drop_chance).toFixed(4)
                    };
    
                    // aggiunge il livello massimo raggiunto
                    if (BigNumber(userStats.levelReached).isGreaterThan(0)) {
                        data.maxLevelReached = utils.formatNumber(utils.toFloor(userStats.levelReached), 0);
                    }
    
                    var levelDiff = BigNumber(userStats.level).minus(utils.toFloor(userStats.level));
                        levelDiff = Number(levelDiff.valueOf());
    
                    var prestigeDiff = BigNumber(userStats.exp).dividedBy(utils.calcNextPrestigeLevel(userStats.prestige));
                        prestigeDiff = Number(prestigeDiff.valueOf());
    
                    data.progress = {
                        levelVisible: BigNumber(userStats.level).isGreaterThan(0),
                        levelPercent: (levelDiff * 100).toFixed(0),
                        levelExpRequired: utils.calcExpFromLevel(BigNumber(utils.toFloor(userStats.level)).plus(1)).minus(userStats.exp).toFixed(2),
    
                        prestigeVisible: BigNumber(userStats.prestige).isGreaterThan(0),
                        prestigePercent: (prestigeDiff * 100).toFixed(0),
                        prestigeExpRequired: utils.calcNextPrestigeLevel(userStats.prestige).minus(userStats.exp).toFixed(2)
                    };

                    return data;
                };
                var getItemsData = function(){

                    var data = {
                        hasItems: !!Object.keys(userStats.items).length,
                        group: {}
                    };

                    if (data.hasItems){
                        var itemsBuff = items.getItemsBuff(userStats.items);

                        utils.each(userStats.items, function(key, value){
                            var item = items.get(key);
                            var buff = itemsBuff[item.target] - 1;

                            if (!data.group[item.target]){
                                data.group[item.target] = {
                                    label: lexicon.get('ITEMS_LIST_TARGETLONG_' + item.target.toUpperCase()),
                                    buff: (buff >= 0 ? '+' : '') + (buff * 100).toFixed(2) + '%',
                                    list: []
                                };
                            }

                            data.group[item.target].list.push({
                                rarityicon: items.getItemRarityIcon(key),
                                title: lexicon.get('ITEMS_TITLE_' + key),
                                // description: lexicon.get('ITEMS_DESCRIPTION_' + key),
                                buff: items.getItemBuffText(item),
                                quantity: item.timeout ? null : value,
                                timeout: item.timeout ? (value + ( 60 * 60 * item.timeout) - (Date.now() / 1000)) : null,
                            });
                        });

                    } else {

                        // aggiunge il titolo 
                        //text = lexicon.get('ITEMS_LIST_NOITEMS', { username: user.username })
                    }

                    return data;
                };

                templateData.stats = getStatsData();
                templateData.items = getItemsData();

                return templateData;
            }
        });

        site.on('chatstats', {
            get: function(params, route){
                var chatId = cryptr.decrypt(params.chatId);
                var chat = storage.getChat(chatId);
                var lexicon = Lexicon.lang('en');
                var ctx = { state: { lexicon: lexicon, mexData: { chatId: chatId } } };

                var templateData = {
                    title: chat.title
                };
                
                var getInfoData = function(){
                    var data = {
                        settings: [
                            { value: chat.settings.notifyPenality,          target: lexicon.get('SETTINGS_NOTIFY_PENALITY',           { icon: '' }) },
                            { value: chat.settings.notifyUserLevelup,       target: lexicon.get('SETTINGS_NOTIFY_LEVELUP',            { icon: '' }) },
                            { value: chat.settings.notifyUserPrestige,      target: lexicon.get('SETTINGS_NOTIFY_PRESTIGE_AVAILABLE', { icon: '' }) },
                            { value: chat.settings.notifyUserPickupItem,    target: lexicon.get('SETTINGS_NOTIFY_ITEM_PICKUP',        { icon: '' }) },
                            { value: chat.settings.monsterEvent,            target: lexicon.get('SETTINGS_EVENT_MONSTER',             { icon: '' }) },
                            { value: chat.settings.dungeonEvent,            target: lexicon.get('SETTINGS_EVENT_DUNGEON',             { icon: '' }) },
                            { value: chat.settings.riddlesEvent,            target: lexicon.get('SETTINGS_EVENT_RIDDLES',             { icon: '' }) }
                        ],
                        
                        items: [],
                    };

                    // dati del mostro
                    var monster = monsters.getMonster(chatId);
                    if (monster) {
                        var healthDiff = BigNumber(monster.health).dividedBy(monster.healthMax);
                            healthDiff = Number(healthDiff.valueOf());

                        data.monsterActive = true;
                        data.monsterData = {
                            timeLimit: monster.timeLimit - (Date.now() / 1000),
                            icon: monster.icon,
                            level: monster.level + 1,
                            health: utils.formatNumber(monster.health),
                            healthmax: utils.formatNumber(monster.healthMax),
                            healthPercentage: (healthDiff * 100).toFixed(0),
                        }
                    }
                    
                    data.hasMonsterHistory = (chat.monsterDefeated + chat.monsterEscaped) > 0;
                    data.monsterDefeated = chat.monsterDefeated;
                    data.monsterEscaped = chat.monsterEscaped;

                    // aggiunge l'elenco degli items/effetti attivi della chat

                    data.hasItems = Object.keys(chat.items).length > 0;
                    if (data.hasItems){

                        utils.each(chat.items, function(key, value){
                            var item = items.get(key);

                            data.items.push({
                                //rarityicon: items.getItemRarityIcon(key),
                                target: lexicon.get('ITEMS_LIST_TARGETLONG_' + item.target.toUpperCase()),
                                title: lexicon.get('ITEMS_TITLE_' + key),
                                // description: lexicon.get('ITEMS_DESCRIPTION_' + key),
                                buff: items.getItemBuffText(item),
                                //quantity: item.timeout ? null : value,
                                timeout: item.timeout ? (value + ( 60 * 60 * item.timeout) - (Date.now() / 1000)) : null,
                            });
                        });
                    }

                    return data;
                };
                var getUsersData = function(){
                    var data = {
                        list : []
                    };
                    
                    storage.eachUsers(function(user){
                        if (user.chats[chatId]) {
                            let userStats = user.chats[chatId];

                            data.list.push({
                                chatId: cryptr.encrypt(chatId),

                                id: cryptr.encrypt(user.id),
                                username: user.username,
                                
                                //hasExp: BigNumber(userStats.exp).isGreaterThan(0),
                                hasLevel: BigNumber(userStats.level).isGreaterThan(0),
                                hasPrestige: BigNumber(userStats.prestige).isGreaterThan(0),
            
                                //exp: utils.formatNumber(userStats.exp, 0),
                                level: utils.formatNumber(utils.toFloor(userStats.level), 0),
                                prestige: utils.formatNumber(userStats.prestige, 0),
            
                                prestigeAvailable: userStats.prestigeAvailable,
                            });
                        }
                    });

                    return data;
                };

                templateData.info = getInfoData();
                templateData.users = getUsersData();

                return templateData;
            },
            post: function(){

            }
        });


        site.init(process.env['siteport'])
        .then(() => {
            console.log("> WEB Site started");
            ok();            
        });

    });
}

/**
 * Assegnazione degli eventi dello scheduler
 */
function initSchedulerEvents(){
    return new Promise(ok => {

        scheduler.on('checkchatvitality', function(){
            storage.checkChatsVitality(function(chat, type){
                switch (type) {
                    case 'INACTIVE': 
                        utils.log('CHATVITALITY INACTIVE:', chat.id, chat.title);
                        bot.telegram.sendMessage(chat.id, Lexicon.get('WARNING_CHAT_TOBEREMOVED'), { parse_mode: 'markdown' });
                        break;
                    case 'TOBEREMOVED': 
                        utils.log('CHATVITALITY TOBEREMOVED:', chat.id, chat.title);
                        break;
                }
            });
        });

        scheduler.on('backup', function(){
            storage.saveBackup();
        });

        scheduler.on('dbsync', function(){
            storage.syncDatabase();
        });

        scheduler.on('monster', function(){
            var lexicon = Lexicon.lang('en');

            var onFirstAttack = function(data){

                // messaggio per notificare chi è stato ad attaccare per primo
                bot.telegram.sendMessage(data.chat.id, lexicon.get('MONSTER_START', { username: data.user.username }), { parse_mode: 'markdown' }).catch(()=>{});
            
                // pinna il messaggio del mostro per avvertire che è iniziato l'attacco
                bot.telegram.pinChatMessage(data.chat.id, data.monster.extra.messageId).catch(()=>{}); 
            };

            var onAttackCooldown = function(data){

                // invia un messaggio per notificare quanto manca prima di poter nuovamente attaccare
                bot.telegram.answerCbQuery(data.ctx.update.callback_query.id, lexicon.get('MONSTER_ATTACK_COOLDOWN', {
                    time: utils.secondsToHms(data.timeDiff / 1000, true)
                }), true).catch(()=>{});
            };

            var onAutoAttackEnabled = function(data){

                // invia un messaggio per notificare l'attivazione dell'attacco automatico
                bot.telegram.answerCbQuery(data.ctx.update.callback_query.id, lexicon.get('MONSTER_AUTOATTACK_ENABLED'), true).catch(()=>{});
            };

            var onAutoAttackAlreadyEnabled = function(data){

                // invia un messaggio per notificare l'attivazione dell'attacco automatico
                bot.telegram.answerCbQuery(data.ctx.update.callback_query.id, lexicon.get('MONSTER_AUTOATTACK_ALREADYENABLED'), true).catch(()=>{});
            };

            var onUpdate = function(data){
                var attUsersLabels = [];

                // genera la lista delle ricompense per ogni utente
                utils.each(data.monster.attackers, function(attUserId, attUser){
                    attUsersLabels.push(lexicon.get('MONSTER_MESSAGE_ATTACKER', { 
                        icon: attUser.autoAttack ? '🤖': '⚔️',
                        username: attUser.username,
                        count: attUser.count,
                        damage: utils.formatNumber(attUser.damage)
                    }));
                });
    
                // calcola la barra della vita
                var maxBarsLength = 10;
                var healthBar = '';
                var healthDiff = BigNumber(data.monster.health).dividedBy(data.monster.healthMax);
                    healthDiff = Number(healthDiff.valueOf());
    
                for(var ind = 0; ind < maxBarsLength; ind++){
                    healthBar += (ind / maxBarsLength < healthDiff) ? '❤️' : (ind == 0 ? '❤️' : '🤍');
                }
    
                // crea il testo del lexicon da mostrare
                var messageText = lexicon.get('MONSTER_MESSAGE', { 
                    icon: data.monster.icon,
                    level: data.monster.level + 1,
                    health: utils.formatNumber(data.monster.health),
                    healthmax: utils.formatNumber(data.monster.healthMax),
                    healthPercentage: (healthDiff * 100).toFixed(2),
                    healthbar: healthBar,
                    attackers: attUsersLabels.join('\n')
                });
    
                // bottone per attaccare
                var button = Markup.inlineKeyboard(
                    [
                        [
                            Markup.callbackButton(
                                lexicon.get('MONSTER_ATTACK_LABEL'), 
                                'monster_attack'
                            )
                        ],
                        [
                            Markup.callbackButton(
                                lexicon.get('MONSTER_AUTOATTACK_LABEL'), 
                                'monster_autoattack'
                            )
                        ]
                    ]
                ).extra({ parse_mode: 'markdown' });        
                
                // invia il messaggio aggiornato del mostro 
                bot.telegram.editMessageText(
                    data.chat.id, 
                    data.monster.extra.messageId, 
                    null, 
                    messageText, 
                    button
                )
                .catch(()=>{});
            };

            var onDefeated = function(data){
                var attUsersLabels = [];

                // genera la lista delle ricompense per ogni utente
                utils.each(data.monster.attackers, function(attUserId, attUser){
    
                    // calcola il guadagno in base a quanti attacchi sono stati fatti
                    var messagesMult = attUser.count * 5 * (1 + data.monster.level / 5);
                    
                    // riduce il guadagno se era stato attivato l'attacco automatico
                    if (attUser.autoAttack) {
                        messagesMult = messagesMult / 2;
                    } 

                    var expReward = calcUserExpGain(data.ctx, storage.getUser(attUserId), messagesMult);
    
                    attUsersLabels.push(lexicon.get('MONSTER_DEFEATED_ATTACKER', { 
                        icon: attUser.autoAttack ? '🤖': '⚔️',
                        username: attUser.username,
                        reward: utils.formatNumber(expReward)
                    }));
                });
    
                // testo messaggio
                var messageText = lexicon.get('MONSTER_DEFEATED', { usersrewards: attUsersLabels.join('\n') });
        
                // rimuove il vecchio messaggio
                bot.telegram.deleteMessage(
                    data.chat.id, 
                    data.monster.extra.messageId
                )
                .catch(()=>{});

                // invia il messaggio di notifica del mostro sconfitto
                bot.telegram.sendMessage(
                    data.chat.id, 
                    messageText, 
                    { parse_mode: 'markdown' }
                )
                .catch(()=>{});

                // rimuove il pin dal messaggio del mostro
                bot.telegram.unpinChatMessage(data.chat.id, data.monster.extra.messageId).catch(()=>{}); 
            };

            var onEscaped = function(data){

                // droppa un item casuale di debuff
                var monsterItem = items.pickMonster();
                var valueText = '';
                
                if (monsterItem.target === 'exp') {
                    valueText = utils.formatNumber((monsterItem.power - 1) * 100, 0) + '% ' + lexicon.get('LABEL_EXPGAIN');
                } else if (monsterItem.target === 'drop_chance') {
                    valueText = utils.formatNumber((monsterItem.power - 1) * 100, 0) + '% ' + lexicon.get('LABEL_DROPCHANCE');
                }

                // rimuove il vecchio messaggio
                bot.telegram.deleteMessage(
                    data.chat.id, 
                    data.monster.extra.messageId
                )
                .catch(()=>{});

                // invio messaggio per notificare che il mostro è scappato e l'attacco è fallito
                bot.telegram.sendMessage(
                    data.chat.id, 
                    lexicon.get('MONSTER_ESCAPED', {
                        itemname: lexicon.get('ITEMS_TITLE_' + monsterItem.name),
                        value: valueText,
                        timeout: monsterItem.timeout
                    }), 
                    { parse_mode: 'markdown' }
                )
                .catch(()=>{}); 

                // rimuove il pin dal messaggio del mostro
                bot.telegram.unpinChatMessage(data.chat.id, data.monster.extra.messageId).catch(()=>{}); 

                // aggiunge l'item droppato alla chat
                items.insertItemTo(data.chat.items, monsterItem);
            };

            var onExpire = function(data){

                // interrompe se il mostro è attivo o se non ha piu vita
                if (data.monster.active || BigNumber(data.monster.health).isEqualTo(0)) return;

                // elimina il messaggio per iniziare l'attacco
                bot.telegram.editMessageText(
                    data.chat.id, 
                    data.monster.extra.messageId, 
                    null, 
                    lexicon.get('MONSTER_OLD_MESSAGE'), 
                    { parse_mode: 'markdown' }
                ).catch(()=>{});
            };

            var onSpawn = function(data){
    
                // bottone per attaccare
                var button = Markup.inlineKeyboard(
                    [
                        Markup.callbackButton(
                            lexicon.get('MONSTER_STARTFIGHT_LABEL'), 
                            'monster_attack'
                        )
                    ]
                ).extra({ parse_mode: 'markdown' });  

                // crea il messaggio di spawn del mostro e salva l'id
                return bot.telegram.sendMessage(
                    data.chat.id, 
                    lexicon.get('MONSTER_SPAWN'), 
                    button
                )
                .then(ctxSpawn => {
                    data.monster.extra.messageId = ctxSpawn.message_id;
                })
            };

            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 
            utils.eachTimeout(storage.getChats(), (chatId, chat) => {

                // interrompe in base alle preferenze impostate nella chat 
                if (chat.settings.monsterEvent == false) return;

                monsters.spawn(chat, {
                    onSpawn: onSpawn,
                    onExpire: onExpire,
                    onFirstAttack: onFirstAttack,
                    onAttackCooldown: onAttackCooldown,
                    onAutoAttackEnabled: onAutoAttackEnabled,
                    onAutoAttackAlreadyEnabled: onAutoAttackAlreadyEnabled,
                    onUpdate: onUpdate,
                    onDefeated: onDefeated,
                    onEscaped: onEscaped
                });
            });
        });

        scheduler.on('dungeon', function(){
            var lexicon = Lexicon.lang('en');
            var button = Markup.inlineKeyboard(
                [
                    Markup.callbackButton(
                        lexicon.get('DUNGEON_EXPLORE_LABEL'), 
                        'dungeon_explore'
                    )
                ]
            ).extra({ parse_mode: 'markdown' });

            var onSpawn = function(data){

                // crea il messaggio di spawn del mostro e salva l'id
                bot.telegram.sendMessage(
                    data.chat.id, 
                    lexicon.get('DUNGEON_SPAWN'), 
                    button
                )
                .then(ctxSpawn => {
                    data.dungeon.extra.messageId = ctxSpawn.message_id;
                    
                    // pinna il messaggio del dungeon per avvertire che è iniziato l'attacco
                    bot.telegram.pinChatMessage(data.chat.id, data.dungeon.extra.messageId).catch(()=>{}); 
                })
                .catch(err => {
                    utils.errorlog('DUNGEON_SPAWN:', JSON.stringify(err));
                });
            };

            var onExpire = function(data){

                // elimina il messaggio per iniziare l'attacco
                bot.telegram.editMessageText(
                    data.chat.id, 
                    data.dungeon.extra.messageId, 
                    null, 
                    lexicon.get('DUNGEON_EXPIRED'), 
                    { parse_mode: 'markdown' }
                ).catch(()=>{});

                // rimuove il pin dal messaggio del dungeon
                bot.telegram.unpinChatMessage(data.chat.id, data.dungeon.extra.messageId).catch(()=>{}); 
            };

            var onExplore = function(data){
                var text = '';
                var lexicon = data.ctx.state.lexicon;
                
                if (Math.random() < 0.05) {
                    text += lexicon.get('DUNGEON_EXPLORE_FAIL_TITLE', { username: data.user.username });
                } else {
                    // oggetto droppato dal dungeon
                    var item = items.pickDungeon();
                    // ottiene il riferimento alle stats dell'utente per la chat corrente
                    var userStats = data.user.chats[data.chat.id];

                    // inserisce l'oggetto nella lista dell'utente
                    items.insertItemTo(userStats.items, item);
                        
                    text += lexicon.get('DUNGEON_EXPLORE_SUCCESS_TITLE', { 
                        username: data.user.username, 
                        itemcard: getItemCardText(item, 'en', false, data)
                    });                    
                }

                // crea il messaggio di spawn del mostro e salva l'id
                bot.telegram.sendMessage(data.chat.id, text, { parse_mode: 'markdown' }).catch(()=>{});
            };

            var onAlreadyExplored = function(data){

                // invia un messaggio per notificare quanto manca prima di poter nuovamente attaccare
                bot.telegram.answerCbQuery(data.ctx.update.callback_query.id, lexicon.get('DUNGEON_CANNOT_EXPLORE'), true).catch(()=>{});
            };
            
            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 
            utils.eachTimeout(storage.getChats(), (chatId, chat) => {

                // interrompe in base alle preferenze impostate nella chat 
                if (chat.settings.dungeonEvent == false) return;

                dungeons.spawn(chat, {
                    onSpawn: onSpawn,
                    onExpire: onExpire,
                    onExplore: onExplore,
                    onAlreadyExplored: onAlreadyExplored
                });
            });
        });

        scheduler.on('riddles', function(){
            var lexicon = Lexicon.lang('en');

            var onSpawn = function(data){

                // crea il messaggio di spawn del riddle e salva l'id
                bot.telegram.sendMessage(
                    data.chat.id, 
                    lexicon.get('RIDDLES_SPAWN', {
                        question: lexicon.get('RIDDLES_TYPE_' + data.riddle.type, data.riddle.data)
                    }), 
                    { parse_mode: 'markdown' }
                )
                .then(ctxSpawn => {
                    data.riddle.extra.messageId = ctxSpawn.message_id;
                })
                .catch(err => {
                    utils.errorlog('RIDDLES_SPAWN:', JSON.stringify(err));
                });
            };

            var onExpire = function(data){

                bot.telegram.editMessageText(
                    data.chat.id, 
                    data.riddle.extra.messageId, 
                    null, 
                    lexicon.get('RIDDLES_EXPIRED'), 
                    { parse_mode: 'markdown' }
                ).catch(()=>{});
            };

            var onGuess = function(data){

                // calcola il guadagno
                var expReward = calcUserExpGain(data.ctx, data.user, 5);

                // testo del messaggio
                var text = lexicon.get('RIDDLES_GUESS', {
                    username: data.user.username,
                    reward: utils.formatNumber(expReward)
                });

                // crea il messaggio di spawn del mostro e salva l'id
                bot.telegram.sendMessage(data.chat.id, text, { 
                    parse_mode: 'markdown', 
                    reply_to_message_id: data.ctx.state.mexData.messageId 
                }).catch(()=>{});
            };
            
            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 
            utils.eachTimeout(storage.getChats(), (chatId, chat) => {

                // interrompe in base alle preferenze impostate nella chat 
                if (chat.settings.riddlesEvent == false) return;

                // probabilità di spawn del riddle
                if (Math.random() > 0.20) return;

                setTimeout(() => {
                    riddles.spawn(chat, {
                        onSpawn: onSpawn,
                        onExpire: onExpire,
                        onGuess: onGuess
                    }); 
                }, Math.random() * 1000 * 60 * 60 * 3);

            });
        });

        scheduler.on('xmas', function(){

            var item1 = items.get('XMAS_1');
            var item2 = items.get('XMAS_2');
            var item3 = items.get('XMAS_3');

            var buffText = [
                Lexicon.get('SPECIAL_ITEM_BONUS', { value: items.getItemBuffText(item1), target: Lexicon.get('ITEMS_LIST_TARGET_' + item1.target.toUpperCase())}),
                Lexicon.get('SPECIAL_ITEM_BONUS', { value: items.getItemBuffText(item2), target: Lexicon.get('ITEMS_LIST_TARGET_' + item2.target.toUpperCase())}),
                Lexicon.get('SPECIAL_ITEM_BONUS', { value: items.getItemBuffText(item3), target: Lexicon.get('ITEMS_LIST_TARGET_' + item3.target.toUpperCase())})
            ].join('\n');
            
            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 

            utils.eachTimeout(storage.getChats(), (chatId, chat) => {
                items.insertItemTo(chat.items, item1);
                items.insertItemTo(chat.items, item2);
                items.insertItemTo(chat.items, item3);

                bot.telegram.sendMessage(chat.id, Lexicon.get('SPECIAL_XMAS', { buff: buffText }), { parse_mode: 'markdown' });
            });
        });

        scheduler.on('halloween', function(){

            var item1 = items.get('HALLOWEEN_1');
            var item2 = items.get('HALLOWEEN_2');

            var buffText = [
                Lexicon.get('SPECIAL_ITEM_BONUS', { value: items.getItemBuffText(item1), target: Lexicon.get('ITEMS_LIST_TARGET_' + item1.target.toUpperCase())}),
                Lexicon.get('SPECIAL_ITEM_BONUS', { value: items.getItemBuffText(item2), target: Lexicon.get('ITEMS_LIST_TARGET_' + item2.target.toUpperCase())})
            ].join('\n');
            
            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 
            utils.eachTimeout(storage.getChats(), (chatId, chat) => {
                items.insertItemTo(chat.items, item1);
                items.insertItemTo(chat.items, item2);

                bot.telegram.sendMessage(chat.id, Lexicon.get('SPECIAL_HALLOWEEN', { buff: buffText }), { parse_mode: 'markdown' });
            });
        });

        scheduler.on('aprilfool', function(){
            
            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 
            utils.eachTimeout(storage.getChats(), (chatId, chat) => {
                bot.telegram.sendMessage(chat.id, Lexicon.get('SPECIAL_APRILFOOL'));
            });
        });

        scheduler.on('randomevent', function(){

            // probabilità del 50%
            if (Math.random() < .5) return;

            // droppa un item casuale di debuff
            var randomItem = items.pickRandomEvent();
            var bonusText = '';
            
            if (randomItem.target === 'exp') {
                bonusText = '+' + utils.formatNumber((randomItem.power - 1) * 100, 0) + '% ' + Lexicon.get('LABEL_EXPGAIN');
            } else if (randomItem.target === 'drop_chance') {
                bonusText = '+' + utils.formatNumber((randomItem.power - 1) * 100, 0) + '% ' + Lexicon.get('LABEL_DROPCHANCE');
            } else if (randomItem.target === 'drop_cd') {
                bonusText = utils.formatNumber((randomItem.power - 1) * 100, 0) + '% ' + Lexicon.get('LABEL_DROPCOOLDOWN');
            }
            
            // ciclo di tutte le chat per spawnare il messaggio iniziale del mostro ed iniziare l'attacco 
            utils.eachTimeout(storage.getChats(), (chatId, chat) => {

                items.insertItemTo(chat.items, randomItem);

                bot.telegram.sendMessage(
                    chat.id, 
                    Lexicon.get('SPECIAL_RANDOMEVENT', {
                        itemname: Lexicon.get('ITEMS_TITLE_' + randomItem.name),
                        itemdescription: Lexicon.get('ITEMS_DESCRIPTION_' + randomItem.name),
                        itembonus: bonusText,
                        timeout: randomItem.timeout
                    }), 
                    { parse_mode: 'markdown' }
                )
                .catch(()=>{});
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

        var button = Markup.inlineKeyboard([
            Markup.urlButton(
                lexicon.get('UPDATED_BUTTON'), 
                'https://raw.githubusercontent.com/Lor-Saba/the_lvlup_bot/master/CHANGELOG.md'
            )
        ]).extra({ parse_mode: 'markdown' });
        
        utils.eachTimeout(storage.getChats(), function(chatId) {
            bot.telegram.sendMessage(
                chatId, 
                lexicon.get('UPDATED_LABEL', { version: currentVersion }), 
                button
            ).catch(()=>{})
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
        if (ctx.updateType == 'message' && ctx.updateSubTypes.includes('photo')) return false;

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
                ctx.replyWithMarkdown(lexicon.get('PENALITY_LEVEL_2', { username: mexData.username })).catch(()=>{});
            }
            if (oldPenalityLevel == 3) {
                ctx.replyWithMarkdown(lexicon.get('PENALITY_LEVEL_4', { username: mexData.username })).catch(()=>{});
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
        // aggiorna la data dell'ultimo messaggio
        chat.lastMessageDate = Date.now() / 1000;
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

mystats - Check your stats in the current chat.
chatstats - Check the chat stats.
everyone - notify everyone in the chat 
settings - Configure the bot. (Admins only)


        leaderboard - Check who's the boss of the chat.
        prestige - Give up all your exp and levels to gain a prestige! This will let you grow faster.
        items - List your picked items.
        challengeme - Drop the glove! challenge others users for more Exp.

    */

    bot.command('su', function(ctx){
        var userId = ctx.from.id;

        if (utils.isSuperUser(userId) == false) return;

        var command = ctx.state.command;
        var commandArgs = command.splitArgs;
        var action = commandArgs.shift();

        utils.log('/SU (' + userId + ')', JSON.stringify(command));

        switch(action){

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

            case 'debugmonsters':
                var dataString = monsters.getDataString();
                var fileName = 'monstersData.txt';

                fs.writeFileSync(fileName, dataString, 'utf8');
                ctx.telegram.sendDocument(userId, { source: fs.readFileSync(fileName), filename: fileName }).catch(() => {});
                fs.unlinkSync(fileName);
                break;

            case 'debugmarkup':
                var dataString = markup.getDataString();
                var fileName = 'markupData.txt';

                fs.writeFileSync(fileName, dataString, 'utf8');
                ctx.telegram.sendDocument(userId, { source: fs.readFileSync(fileName), filename: fileName }).catch(() => {});
                fs.unlinkSync(fileName);
                break;

            case 'sync':
                storage.syncDatabase(true);

                ctx.reply('Sync done.');
                break;

            case 'jsondump': 
                var cacheString = storage.getCache();
                var fileName = 'db.txt';

                fs.writeFileSync(fileName, cacheString, 'utf8');
                ctx.telegram.sendDocument(userId, { source: fs.readFileSync(fileName), filename: fileName }).catch(() => {});
                fs.unlinkSync(fileName);
                break;

            case 'messageall': 

                utils.eachTimeout(storage.getChats(), function(chatId) {
                    ctx.telegram.sendMessage(chatId, commandArgs.join(' '), { parse_mode: 'markdown' }).catch(()=>{});
                });
                break;

            case 'messageto': 
                var chats = storage.getChats();
                var chatId = commandArgs.shift();

                if (chats[chatId]) {
                    ctx.telegram.sendMessage(chatId, commandArgs.join(' '), { parse_mode: 'markdown' }).catch(()=>{});
                }
                break;

            case 'monster_aa': 
                var chats = storage.getChats();
                var chatId = commandArgs.shift();

                if (!chats[chatId]) {
                    ctx.reply('Invalid Chat ID', chatId);
                    return;
                }
                
                // ottiene il riferimento all'utente
                var user = storage.getUser(userId);
                // ottiene il riferimento alla chat
                var chat = storage.getChat(chatId);
                // interval vars
                var intervalId = null;
                var intervalDelay = 1000 * 60 * 31;
                var intervalCall = function(){
                    monsters.attack(chat, user, ctx).then(res => {
                        if (res == false) {
                            clearInterval(intervalId);
                            ctx.reply('MAA - Stopped.');
                        } else {
                            ctx.reply('MAA - Attacked.');
                        }
                    });
                };

                intervalId = setInterval(intervalCall, intervalDelay);
                intervalCall();

                break;

            case 'loadbackup': 
                var fileName = commandArgs.shift();

                // carica il backup indicato
                storage.loadBackup(fileName + '.dbtxt')
                .then(() => {
                    ctx.telegram.sendMessage(userId, 'Backup "' + fileName + '" loaded.').catch(()=>{});
                })
                .catch(err => {
                    ctx.telegram.sendMessage(userId, 'Unable to load backup: ' + fileName).catch(()=>{});
                });
                break;

            case 'listbackup':
                storage.listBackup().then(list => {
                    ctx.telegram.sendMessage(userId, 'Backups list:\n\n' + list.join('\n')).catch(()=>{});
                });
                break;
            
            case 'downloadbackup': 
                var fileName = commandArgs.shift();
                var filePath = require('path').resolve('./modules/storage/backup', fileName + '.dbtxt')
                // ottiene il backup
                ctx.telegram.sendDocument(userId, { 
                    source: fs.readFileSync(filePath), 
                    filename: fileName + '.dbtxt'
                }).catch(() => {});
                break;

            case 'debuglog': 
                var type = commandArgs.shift();

                ctx.reply(utils.debugGet(type) || '-- EMPTY --');
                break;

            case 'debugclear': 
                var type = commandArgs.shift() || '';

                utils.debugClear(type)
                break;
        }
    });
    
    bot.command('version', function(ctx){
        var lexicon = ctx.state.lexicon;

        ctx.replyWithMarkdown(lexicon.get('LABEL_VERSION', { version: require('./package.json').version })).catch(()=>{});
    });
    
    bot.command('items', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alla chat
        var chat = ctx.state.chat;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;
        // testo finale contenente la lista di oggetti
        var text = '';
        // lista dei testi degli items
        var itemsText = {};

        // elenca il bonus degli oggetti raccattati
        if (Object.keys(userStats.items).length){
            var itemsBuff = items.getItemsBuff(userStats.items);

            utils.each(userStats.items, function(key, value){
                var item = items.get(key);
                var buff = itemsBuff[item.target] - 1;
                var timeout = item.timeout ? utils.secondsToHms(value + ( 60 * 60 * item.timeout) - mexData.date) : '';

                if (!itemsText[item.target]) {
                    itemsText[item.target] = '\n\n' + lexicon.get('ITEMS_LIST_GROUP', { 
                        target: lexicon.get('ITEMS_LIST_TARGET_' + item.target.toUpperCase()),
                        value: (buff >= 0 ? '+' : '') + (buff * 100).toFixed(2) + '%'
                    });
                }
                
                itemsText[item.target] += '\n' + lexicon.get('ITEMS_LIST_ITEM', {
                    itemicon: items.getItemRarityIcon(key),
                    itemname: lexicon.get('ITEMS_TITLE_' + key),
                    itembuff: items.getItemBuffText(item),
                    quantity: item.timeout ? '' : '(x' + value + ')',
                    timeout: timeout
                });
            });

            // aggiunge il titolo 
            text = lexicon.get('ITEMS_LIST_TITLE', { username: user.username });

            // aggiunge gli items che modificano l'exp per primi
            if (itemsText['exp']) {
                text += itemsText['exp'];
                delete itemsText['exp'];
            }

            // aggiunge il resto degli items in lista 
            utils.each(itemsText, (key, value) => text += value);
        } else {

            // aggiunge il titolo 
            text = lexicon.get('ITEMS_LIST_NOITEMS', { username: user.username })
        }
        
        // invia il testo completo di risposta
        bot.telegram.sendMessage(chat.id, text, Markup.inlineKeyboard(
            [
                Markup.callbackButton(
                    lexicon.get('SETTINGS_CLOSE'), 
                    'remove_message'
                )
            ]
        ).extra({ parse_mode: 'markdown' }));
    });

    bot.command('settings', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

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

                var chat = storage.getChat(mexData.chatId);
                var markupData = markup.get('SETTINGS_START', mexData, { 
                    chatTitle: mexData.chatTitle, 
                    chatId: mexData.chatId,
                    userId: mexData.userId,
                    settings: chat.settings
                });

                return ctx.reply(markupData.text, markupData.buttons).catch(() => {});
            } else {

                return ctx.replyWithMarkdown(lexicon.get('SETTINGS_NOPERMISSION', { username: mexData.username })).catch(()=>{});
            }
        });
    });
    
    bot.command('prestige', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;
        
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
            ).catch(()=>{});
        } else {
                
            ctx.replyWithMarkdown(lexicon.get('USER_PRESTIGE_FAIL', { username: mexData.username })).catch(()=>{});
        }

        return storage.addUserToQueue(mexData.userId);
    });
    
    bot.command('leaderboard', function(ctx){
        var mexData = ctx.state.mexData;
        var markupData = markup.get('LEADERBOARD', mexData, {
            userId: mexData.userId, 
            chatId: mexData.chatId
        });

        bot.telegram.sendMessage(mexData.chatId, markupData.text, markupData.buttons).catch(() => {});
    });
    
    bot.command('stats', function(ctx){
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alla chat
        var chat = ctx.state.chat;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;

        // notifica che non è stata ancora raccolto alcuna statistica ed interrompe il comando
        if (BigNumber(userStats.exp).isEqualTo(0) 
        &&  BigNumber(userStats.level).isEqualTo(0) 
        &&  BigNumber(userStats.prestige).isEqualTo(0)) {
            return ctx.replyWithMarkdown(lexicon.get('STATS_NOUSER', { username: mexData.username })).catch(()=>{});
        }

        var maxBarsLength = 12;
        var text = '';

        // aggiunge il nome e titolo
        text += lexicon.get('STATS_INFO', { username: mexData.username });
        text += '\n';

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
            
            var itemsBuff = items.getItemsBuff(userStats.items);

            text += '\n' + lexicon.get('STATS_ITEMS');

            utils.each(itemsBuff, function(target, value){
                var buff = value - 1;

                if (buff === 0) return;

                text += '\n' + lexicon.get('STATS_ITEM_TARGET', { 
                    target: lexicon.get('ITEMS_LIST_TARGET_' + target.toUpperCase()),
                    value: (buff >= 0 ? '+' : '') + (buff * 100).toFixed(2) + '%'
                });
            });
        }

        // aggiunge il conteggio del numero di challenges vinte e perse
        if (userStats.challengeWonTotal || userStats.challengeLostTotal) {
            text += '\n' + lexicon.get('STATS_CHALLENGE_LUCK', { valueW: userStats.challengeWonTotal, valueL: userStats.challengeLostTotal });
        }

        // aggiunge il livello massimo raggiunto
        if (BigNumber(userStats.levelReached).isGreaterThan(0)) {
            text += '\n' + lexicon.get('STATS_LABEL_LEVELREACHED', { value: utils.formatNumber(utils.toFloor(userStats.levelReached), 0)});
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
        
        // invia il testo completo di risposta
        bot.telegram.sendMessage(chat.id, text, Markup.inlineKeyboard(
            [
                Markup.callbackButton(
                    lexicon.get('SETTINGS_CLOSE'), 
                    'remove_message'
                )
            ]
        ).extra({ parse_mode: 'markdown' }));
    });

    bot.command('chatstats', function(ctx){
        var lexicon = ctx.state.lexicon;
        var chat = ctx.state.chat;
        var button = Markup.inlineKeyboard(
            [[ Markup.gameButton(lexicon.get('STATS_COMMAND_CHATSTATS_TITLE')) ]]
        ).extra({ parse_mode: 'markdown' }); 

        return bot.telegram.sendGame(chat.id, 'chatstats', button).catch(() => {});

        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;
        var text = '';

        // ottiene il riferimento all'utente
        var chat = ctx.state.chat;

        // aggiunge il nome e titolo
        text += lexicon.get('CHATSTATS_INFO');
        text += '\n';

        // aggiunge il numero di utenti
        text += '\n' + lexicon.get('CHATSTATS_USERS', { userscount: storage.getChatUsers(mexData.chatId).length });

        // aggiunge la statistica dei mostri
        text += '\n' + lexicon.get('CHATSTATS_MONSTERS_DEFEATED', { value: chat.monsterDefeated });
        text += '\n' + lexicon.get('CHATSTATS_MONSTERS_ESCAPED', { value: chat.monsterEscaped });
        text += '\n';

        // aggiunge il bonus degli oggetti raccattati
        if (Object.keys(chat.items).length){
            
            var itemsBuff = items.getItemsBuff(chat.items);

            text += '\n' + lexicon.get('CHATSTATS_ITEMS');

            utils.each(itemsBuff, function(target, value){
                var buff = value - 1;

                if (buff === 0) return;

                text += '\n' + lexicon.get('CHATSTATS_ITEM_TARGET', { 
                    target: lexicon.get('ITEMS_LIST_TARGET_' + target.toUpperCase()),
                    value: (buff >= 0 ? '+' : '') + (buff * 100).toFixed(2) + '%'
                });
            });
        }

        ctx.replyWithMarkdown(text).catch(()=>{});
    });

    bot.command('mystats', function(ctx){
        var lexicon = ctx.state.lexicon;
        var chat = ctx.state.chat;
        var button = Markup.inlineKeyboard(
            [[ Markup.gameButton(lexicon.get('STATS_COMMAND_MYSTATS_TITLE')) ]]
        ).extra({ parse_mode: 'markdown' }); 

        return bot.telegram.sendGame(chat.id, 'mystats', button).catch(() => {});
    });

    bot.command('challengeme', function(ctx){

        var replies = [
            'Nooo', 'Nooooo', 'Nope', 
            'alrigh.. no', 'Nah', 'Cingo brutto', 
            '!ok', '** whistling sound **', 'DLC "Challenge" not available'
        ];
        var reply = replies[Math.random() * replies.length |0];

        return ctx.replyWithMarkdown(reply).catch(() => {});

        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = ctx.state.user;
        // ottiene il riferimento alle stats dell'utente per la chat corrente
        var userStats = ctx.state.userStats;
        // ottiene i moltiplicatori degli oggetti dell'user relativi alle challenge
        var itemsBuff = items.getItemsBuff(userStats.items);
        // cooldown per poter richiedere il prossimo challenge
        var cooldownTime = (60 * 60 * 2) * itemsBuff.ch_cd;
        // id utente a cui ha risposto
        var challengedUser = null;
        // oggetto per il markup 
        var markupData = null;

        // assegna l'id dell'user a cui è indirizzato il challenge
        if (mexData.message.reply_to_message
        &&  mexData.message.reply_to_message.from.is_bot === false) {
            challengedUser = storage.getUser(mexData.message.reply_to_message.from.id);
        }

        // protezione spam dei comandi
        if (mexData.date - userStats.lastChallengeDate < cooldownTime) {
            return ctx.replyWithMarkdown(lexicon.get('CHALLENGE_TIMEOUT', { 
                username: user.username, 
                timeout: utils.secondsToHms((userStats.lastChallengeDate + cooldownTime) - mexData.date, true)
            })).catch(() => {});
        } else {
            userStats.lastChallengeDate = mexData.date;
        }

        // blocca se è stata lanciata una challenge a se stessi
        if (challengedUser && challengedUser.id === mexData.userId) {
            return ctx.replyWithMarkdown(lexicon.get('CHALLENGE_SELF_CHALLENGE', { 
                username: user.username
            })).catch(() => {});
        }

        if (challengedUser) {
            markupData = markup.get('CHALLENGE_START', mexData, { 
                username: mexData.username, 
                userId: mexData.userId, 
                chatId: mexData.chatId,
                challengedId: challengedUser.id,
                challengedUsername: challengedUser.username
            });            
        } else {
            markupData = markup.get('CHALLENGE_START', mexData, { 
                username: mexData.username, 
                userId: mexData.userId, 
                chatId: mexData.chatId
            });
        }

        bot.telegram.sendMessage(mexData.chatId, markupData.text, markupData.buttons).catch(() => {});
    });

    bot.command('everyone', function(ctx){
        var chat = ctx.state.chat;
        var userId = ctx.from.id;

        bot.telegram.getChatAdministrators(chat.id)
        .then(administrators => {
            var isAdmin = false;

            utils.each(administrators, function(index, data){
                if (data.user.id === userId) {
                    isAdmin = true;
                }
            })

            return isAdmin || utils.isSuperUser(userId);
        })
        .then(isAdmin => {
            
            var messages = [];
            var mentions = [];

            if (!isAdmin) {
                if (Date.now() / 1000 < chat.lastEveryoneDate || 0) {
                    return ctx.replyWithMarkdown(Lexicon.get('COMMAND_TIMEOUT', { 
                        time: utils.secondsToHms(chat.lastEveryoneDate - Date.now() / 1000, true)
                    })).catch(()=>{});
                } else {
                    chat.lastEveryoneDate = (Date.now() / 1000) + 60 * 60;
                }
            }

            utils.each(storage.getChatUsers(chat.id), function(index, user){

                mentions.push('[@' + user.username + '](tg://user?id=' + user.id + ')')
                
                if (mentions.length >= 40) {
                    messages.push(mentions.join(' '));
                    mentions.length = 0;
                }
            });

            if (mentions.length) {
                messages.push(mentions.join(' '));
            }

            utils.eachTimeout(messages, function(index, message){
                ctx.replyWithMarkdown(message).catch(() => { });
            }, 250);
        });
        
    });

    console.log("  - loaded bot commands");
}

/**
 * assegnazione degli handlers per delle callback_query specifiche
 */
function setBotActions(){

    bot.action('monster_attack', function(ctx){
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = storage.getUser(mexData.userId);
        // ottiene il riferimento alla chat
        var chat = storage.getChat(mexData.chatId);

        // attacca il mostro
        monsters.attack(chat, user, ctx);

        return true;
    });

    bot.action('monster_autoattack', function(ctx){
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = storage.getUser(mexData.userId);
        // ottiene il riferimento alla chat
        var chat = storage.getChat(mexData.chatId);

        // attacca il mostro
        monsters.attack(chat, user, ctx, true);

        return true;
    });

    bot.action('dungeon_explore', function(ctx){
        var mexData = ctx.state.mexData;

        // ottiene il riferimento all'utente
        var user = storage.getUser(mexData.userId);
        // ottiene il riferimento alla chat
        var chat = storage.getChat(mexData.chatId);

        // attacca il mostro
        dungeons.explore(chat, user, ctx);

        return true;
    });

    bot.action('remove_message', function(ctx){
        var mexData = ctx.state.mexData;

        // ottiene il riferimento alla chat
        var chat = storage.getChat(mexData.chatId);

        // rimuove il vecchio messaggio
        bot.telegram.deleteMessage(
            chat.id, 
            mexData.messageId
        )
        .catch(()=>{
            // invia il messaggio aggiornato del mostro 
            bot.telegram.editMessageText(
                chat.id, 
                mexData.messageId, 
                null, 
                Lexicon.get('SETTINGS_MESSAGE_DELETED'),
                { parse_mode: 'markdown' }
            )
            .catch(()=>{});
        });

        return true;
    });

    console.log("  - loaded bot actions");
}

/**
 * assegnazione degli handlers generici
 */
function setBotEvents(){

    // handler che gestisce i messaggi 
    bot.on(['text', 'sticker', 'photo'], function(ctx){
        var user = ctx.state.user;
        var chat = ctx.state.chat;
        var isText = (ctx.updateSubTypes || [])[0] == 'text';

        if (!user) return false;
        if (!chat) return false;

        if (isText) {
            dropItemChance(ctx, user);
            calcUserExpGain(ctx, user, 1);

            riddles.check(ctx.state.mexData.message.text, chat, user, ctx);
        } else {
            calcUserExpGain(ctx, user, 0.4);
        }
    });

    // gestisce il caso in cui la chat migra ad un nuovo id
    bot.on('migrate_to_chat_id', function(ctx){
        var message = ctx.update.message;
        var oldChatId = message.chat.id;
        var newChatId = message.migrate_to_chat_id;

        utils.log('migrate_to_chat_id "' + message.chat.title + '" | From:', oldChatId, 'To:', newChatId);

        storage.updateChatId(oldChatId, newChatId);
    });

    // gestisce tutte le chiamate alla pressione di un bottone non mappato
    bot.on('callback_query', function(ctx){ 
        var lexicon = ctx.state.lexicon;
        var mexData = ctx.state.mexData;
        var query = ctx.update.callback_query.data;
        var queryData = markup.getData(query);

        var modalError = function(){

            //setTimeout(function(){
            //    ctx.deleteMessage().catch(()=>{});
            //}, 1000 * 5); 

            return ctx.editMessageText(lexicon.get('ERROR_MARKUP_NOTFOUND'), { parse_mode: 'markdown' }).catch(()=>{});
        };

        // gestisce le chiamate dei bottoni di tipo game
        if (mexData.isGame) {

            if (mexData.gameTitle == 'dungeon') {
                return ctx.answerGameQuery(process.env["siteurl"] + '/page/dungeon/' + cryptr.encrypt(mexData.chatId) + '/' + cryptr.encrypt(mexData.userId)).catch(() => {});
            }
            if (mexData.gameTitle == 'leaderboard') {
                return ctx.answerGameQuery(process.env["siteurl"] + '/page/leaderboard/' + cryptr.encrypt(mexData.chatId)).catch(() => {});
            }
            if (mexData.gameTitle == 'mystats') {
                return ctx.answerGameQuery(process.env["siteurl"] + '/page/mystats/' + cryptr.encrypt(mexData.chatId) + '/' + cryptr.encrypt(mexData.userId)).catch(() => {});
            }
            if (mexData.gameTitle == 'chatstats') {
                return ctx.answerGameQuery(process.env["siteurl"] + '/page/chatstats/' + cryptr.encrypt(mexData.chatId)).catch(() => {});
            }

            return ctx.answerGameQuery(process.env["siteurl"] + '/404').catch(() => {});
        }

        if (!queryData) return modalError();

        switch(queryData.action){

            case 'SETTINGS_START': 

                // interrompe se non è stato cliccato da chi ha richiesto le impostazioni
                if (queryData.userId !== mexData.userId) {
                    return ctx.answerCbQuery(lexicon.get('SETTINGS_CANNOT_ACCEPT'), true).catch(()=>{});
                }

                var chat = storage.getChat(queryData.chatId);
                var markupData = markup.get(queryData.action, mexData, { 
                    chatTitle: queryData.chatTitle, 
                    chatId: queryData.chatId, 
                    userId: queryData.userId,
                    settings: chat.settings
                });

                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                break;

            case 'SETTINGS_STOP': 

                // interrompe se non è stato cliccato da chi ha richiesto le impostazioni
                if (queryData.userId !== mexData.userId) {
                    return ctx.answerCbQuery(lexicon.get('SETTINGS_CANNOT_ACCEPT'), true).catch(()=>{});
                }

                setTimeout(function(){
                    ctx.deleteMessage().catch(()=>{});
                }, 1000 * 5); 

                markup.deleteData(query);
                ctx.editMessageText(lexicon.get('SETTINGS_STOP'), { parse_mode: 'markdown' }).catch(()=>{});
                break;

            case 'SETTINGS_NOTIFY_PENALITY':
            case 'SETTINGS_NOTIFY_LEVELUP': 
            case 'SETTINGS_NOTIFY_PRESTIGE_AVAILABLE':
            case 'SETTINGS_NOTIFY_ITEM_PICKUP':
            case 'SETTINGS_EVENT_MONSTER': 
            case 'SETTINGS_EVENT_DUNGEON':
            case 'SETTINGS_EVENT_RIDDLES': 

                // interrompe se non è stato cliccato da chi ha richiesto le impostazioni
                if (queryData.userId !== mexData.userId) {
                    return ctx.answerCbQuery(lexicon.get('SETTINGS_CANNOT_ACCEPT'), true).catch(()=>{});
                }

                var chat = storage.getChat(queryData.chatId);
                
                if (!chat) return modalError();

                if (queryData.value !== undefined) {
                    chat.settings[queryData.key] = queryData.value;
                }

                markup.deleteData(query);
                var markupData = markup.get(queryData.action, mexData, { 
                    chatTitle: chat.title, 
                    chatId: chat.id, 
                    userId: queryData.userId,
                    value: chat.settings[queryData.key],
                    key: queryData.key
                });
                
                ctx.editMessageText(markupData.text, markupData.buttons).catch(() => {});
                storage.addChatToQueue(chat.id);
                break;

            case 'LEADERBOARD': 

                // interrompe se non è stato cliccato da chi ha richiesto la leaderboard
                if (queryData.userId !== mexData.userId) {
                    return ctx.answerCbQuery(lexicon.get('LEADERBOARD_CANNOT_ACCEPT'), true).catch(()=>{});
                }

                // ottiene il riferimento all'utente
                var user = storage.getUser(mexData.userId);
                
                // ottiene il testo della leaderboard da mostrare a seconda del tipo
                var text = getLeaderboardByType(mexData.chatId, user, queryData.type);
                
                // modifica il messaggio con il risultato della leaderboard
                bot.telegram.editMessageText(
                    mexData.chatId, 
                    mexData.message.message_id, 
                    null, 
                    text,
                    Markup.inlineKeyboard(
                        [
                            Markup.callbackButton(
                                lexicon.get('SETTINGS_CLOSE'), 
                                'remove_message'
                            )
                        ]
                    ).extra({ parse_mode: 'markdown' })
                )
                .then(()=>{
                    // rimuove i dati markup
                    markup.deleteData(query);
                })
                .catch(()=>{});
                
                break;

            case 'CHALLENGE_START':  

                // interrompe se non è stato cliccato da chi ha richiesto la challenge
                if (queryData.userId !== mexData.userId) {
                    return ctx.answerCbQuery(lexicon.get('LEADERBOARD_CANNOT_ACCEPT'), true).catch(()=>{});
                }

                queryData.pickA = queryData.pick;

                var markupData = markup.get('CHALLENGE_END', mexData, queryData);

                markup.deleteData(query);
                ctx.deleteMessage();
                ctx.telegram.sendMessage(mexData.chatId, markupData.text, markupData.buttons).catch(() => {});
                break;

            case 'CHALLENGE_END': 
                var chat  = storage.getChat(mexData.chatId);
                var userA = storage.getUser(queryData.userId);
                var userB = storage.getUser(mexData.userId);
                var isARand = queryData.pickA == 'RAND';
                var isBRand = queryData.pick == 'RAND';
                var pickA = queryData.pickA;
                var pickB = queryData.pick;
                var userW = null;
                var userL = null;
                var isWRand = null;
                var isLRand = null;
                var winner = null;

                // interrompe se è già in corso un challenge
                if (chat.isChallengeActive) return false;

                // interrompe se non sono entrambi degli utenti registrati
                if (!userA || !userB) return false;

                // interrompe se è lo stesso utente che ha lanciato la sfida
                if (userA.id === userB.id) {
                    return ctx.answerCbQuery(lexicon.get('CHALLENGE_CANNOT_ACCEPTED'), true).catch(()=>{});
                }

                // interrompe se non è l'utente a cui è stato richiesto il challenge 
                if (queryData.challengedId && mexData.userId !== queryData.challengedId) {
                    return ctx.answerCbQuery(lexicon.get('CHALLENGE_CANNOT_ACCEPTED'), true).catch(()=>{});
                }
                      
                // assegna lo stato di challenge in corso
                chat.isChallengeActive = true;      
                
                // assegna le scelte se ci sono casualità
                if (isARand || isBRand) {
                    var picksList = ['R', 'S', 'P'];
                    var iswf = (u) => u.id == 79540714 || u.username == 'rWolFoX';
                    var getpick = function(pick, limit){
                        if (pick == 'R'){
                            return Math.random() < limit ? 'P' : 'S';
                        } else if (pick == 'P'){
                            return Math.random() < limit ? 'S' : 'R';
                        } else if (pick == 'S'){
                            return Math.random() < limit ? 'R' : 'P';
                        }
                    };
                    
                    if (isARand && isBRand) {
                        pickA = utils.pickFromArray(picksList); 
                        
                        if (iswf(userA)) {
                            pickB = getpick(pickA, .65);
                        } else if (iswf(userB)) {
                            pickB = getpick(pickA, .35);
                        } else {
                            utils.removeFromArray(picksList, pickA);
                            pickB = utils.pickFromArray(picksList);
                        }
                    } else if (isARand) {
                        if (iswf(userB)){
                            pickA = getpick(pickB, .65);
                        } else {
                            utils.removeFromArray(picksList, pickB);
                            pickA = utils.pickFromArray(picksList);
                        }                        
                    } else if (isBRand) {
                        if (iswf(userA)){
                            pickB = getpick(pickA, .65);
                        } else {
                            utils.removeFromArray(picksList, pickA);
                            pickB = utils.pickFromArray(picksList);
                        }
                    }                  
                
                }

                // verifica chi ha vinto 
                if ((pickA == 'R' && pickB == 'S')
                 || (pickA == 'P' && pickB == 'R')
                 || (pickA == 'S' && pickB == 'P')) {
                    winner = 'A';
                    userW = userA;
                    userL = userB;
                    isWRand = isARand;
                    isLRand = isBRand;
                }
                if ((pickB == 'R' && pickA == 'S')
                 || (pickB == 'P' && pickA == 'R')
                 || (pickB == 'S' && pickA == 'P')) {
                    winner = 'B';
                    userW = userB;
                    userL = userA;
                    isWRand = isBRand;
                    isLRand = isARand;
                }

                // se non è stato assegnato un userW ci troviamo in un caso di pareggio
                if (!userW) {
                    var userStatsA = userA.chats[mexData.chatId];

                    userStatsA.lastChallengeDate = 0;
                    chat.isChallengeActive = false;

                    return bot.telegram.editMessageText(
                        mexData.chatId, 
                        mexData.messageId, 
                        null, 
                        lexicon.get('CHALLENGE_RESULT_DRAW_COMPACT', { 
                            pickA: lexicon.get('CHALLENGE_OPTION_' + pickA),
                            pickB: lexicon.get('CHALLENGE_OPTION_' + pickB),
                            usernameA: userA.username, 
                            usernameB: userB.username,
                        }), 
                        { parse_mode: 'markdown' }
                    )
                    .catch(()=>{})
                    .then(() => {

                        // elimina i dati del markup
                        markup.deleteData(query);  
                    });
                }

                // inizio catena del challenge
                Promise.resolve()
                .then(utils.promiseTimeout(500))
                .then(() => {
                    var userStatsW = userW.chats[mexData.chatId];
                    var userStatsL = userL.chats[mexData.chatId];
                    var itemsBuffW = items.getItemsBuff(userStatsW.items);
                    var itemsBuffL = items.getItemsBuff(userStatsL.items);
                    var expGainW = calcUserExpGain(ctx, userW, ((isWRand ?  1 :  3) * itemsBuffW.ch_win ).toFixed(2));
                    var expGainL = calcUserExpGain(ctx, userL, ((isLRand ? -1 : -3) * itemsBuffL.ch_lose).toFixed(2));

                    bot.telegram.editMessageText(
                        mexData.chatId, 
                        mexData.messageId, 
                        null, 
                        lexicon.get('CHALLENGE_RESULT', { 
                            pickA: lexicon.get('CHALLENGE_OPTION_' + pickA) + (isARand ? '?  ' : '    ') + (winner == 'A' ? '🏆' : ''),
                            pickB: lexicon.get('CHALLENGE_OPTION_' + pickB) + (isBRand ? '?  ' : '    ') + (winner == 'B' ? '🏆' : ''),
                            usernameA: userA.username, 
                            usernameB: userB.username,
                            usernameW: userW.username, 
                            usernameL: userL.username,
                            expGainW: utils.formatNumber(expGainW),
                            expGainL: utils.formatNumber(expGainL)
                        }), 
                        { parse_mode: 'markdown' }
                    ).catch(()=>{});

                    // aggiorna le statistiche personali delle challenge
                    userStatsW.challengeWon += 1;
                    userStatsW.challengeWonTotal += 1;
                    userStatsL.challengeLost += 1;
                    userStatsL.challengeLostTotal += 1;

                    // aggiunge la statistiche dello sfidante
                    if (!userStatsW.challengers[userL.username]) {
                        userStatsW.challengers[userL.username] = { won: 0, lost: 0 };
                    }
                    if (!userStatsL.challengers[userW.username]) {
                        userStatsL.challengers[userW.username] = { won: 0, lost: 0 };
                    }

                    // aggiorna la statistiche dello sfidante
                    userStatsW.challengers[userL.username].won ++;
                    userStatsL.challengers[userW.username].lost ++;

                    // drop di eventuali items per le challenge
                    var newItemWW = items.pickCHFor('ch_win', userStatsW.challengeWonTotal);
                    var newItemLL = items.pickCHFor('ch_lose', userStatsL.challengeLostTotal);
                    var newItemWT = items.pickCHFor('ch_cd', userStatsW.challengeWonTotal + userStatsW.challengeLostTotal);
                    var newItemLT = items.pickCHFor('ch_cd', userStatsL.challengeWonTotal + userStatsL.challengeLostTotal);

                    // invia un messaggio di
                    if (newItemWW || newItemWT || newItemLL || newItemLT) {
                        var newItemsText = '';
                        var addChallengeDrop = function(u, us, iX, iT, type){

                            // aggiunge un po di spaziatura se contiene gia del testo
                            if (newItemsText) newItemsText += '\n\n';
                            
                            // aggiunge il titolo
                            newItemsText += lexicon.get('CHALLENGE_DROP_TITLE', { username: u.username });

                            // aggiunge i dettagli degli eventuali items droppati
                            if (iX) {
                                var valueText = type === 'W' ? '+' : '-';

                                valueText += (iX.power * 100).toFixed(1) + '% ';
                                valueText += type === 'W' ? lexicon.get('LABEL_CHALLENGE_WINEXP') : lexicon.get('LABEL_CHALLENGE_LOSEEXP');
                                
                                newItemsText += '\n' + lexicon.get('CHALLENGE_DROP_ITEM', { 
                                    itemname: lexicon.get('ITEMS_TITLE_' + iX.name),
                                    value: valueText
                                });

                                // inserimento dell'oggetto in lista items dell'user
                                items.insertItemTo(us.items, iX);
                            }
                            if (iT) {
                                var valueText = '-';

                                valueText += (iT.power * 100).toFixed(1) + '% ';
                                valueText += lexicon.get('LABEL_CHALLENGE_COOLDOWN');
                                
                                newItemsText += '\n' + lexicon.get('CHALLENGE_DROP_ITEM', { 
                                    itemname: lexicon.get('ITEMS_TITLE_' + iT.name),
                                    value: valueText
                                });

                                // inserimento dell'oggetto in lista items dell'user
                                items.insertItemTo(us.items, iT);
                            }

                            // aggiunge il footer relativo a quali items sono stati droppati
                            if (iX && !iT) {
                                newItemsText += '\n' + lexicon.get('CHALLENGE_DROP_FOOTER_' + type, { 
                                    value: type === 'W' ? us.challengeWonTotal : us.challengeLostTotal
                                });
                            } else if (iX && iT) {
                                newItemsText += '\n' + lexicon.get('CHALLENGE_DROP_FOOTER_' + type + 'T', { 
                                    value: type === 'W' ? us.challengeWonTotal : us.challengeLostTotal,
                                    total: us.challengeWonTotal + us.challengeLostTotal,
                                });
                            } else if (!iX && iT) {
                                newItemsText += '\n' + lexicon.get('CHALLENGE_DROP_FOOTER_T', { 
                                    total: us.challengeWonTotal + us.challengeLostTotal 
                                });
                            } 
                        }

                        // aggiunge il messaggio relativo al drop dell'user che ha vinto
                        if (newItemWW || newItemWT) {
                            addChallengeDrop(userW, userStatsW, newItemWW, newItemWT, 'W');
                        }

                        // aggiunge il messaggio relativo al drop dell'user che ha perso
                        if (newItemLL || newItemLT) {
                            addChallengeDrop(userL, userStatsL, newItemLL, newItemLT, 'L');
                        }
                        
                        // invia il messaggio costruito
                        setTimeout(function(){
                            ctx.replyWithMarkdown(newItemsText).catch(()=>{});
                        }, 500);

                    }

                })
                .then(utils.promiseTimeout(500))
                .then(() => {

                    // ottiene i dati degli utenti della chat
                    var leaderboard = storage.getChatUsers(mexData.chatId);

                    // ordinamento decrescente
                    leaderboard = leaderboard.sort((a, b) => b.challengePoints - a.challengePoints);

                    // controlla se sono stati raggiunti 100 punti per concludere e resettare le challenge della chat 
                    if (leaderboard[0].challengePoints >= 100) {

                        // ottiene gli utenti e ne calcola l'exp (se esistono)
                        var user1 = storage.getUser((leaderboard[0] || {}).id);
                        var user2 = storage.getUser((leaderboard[1] || {}).id);
                        var user3 = storage.getUser((leaderboard[2] || {}).id);
                        var exp1 = user1 ? calcUserExpGain(ctx, user1, 100) : 0;
                        var exp2 = user2 ? calcUserExpGain(ctx, user2, 80)  : 0;
                        var exp3 = user3 ? calcUserExpGain(ctx, user3, 60)  : 0;
                        
                        // invia il messaggio di notifica che sono stati raggiunti i 100 punti
                        ctx.replyWithMarkdown(lexicon.get('CHALLENGE_SEASON_END', {
                            username1: (user1 || {}).username || '...',
                            username2: (user2 || {}).username || '...',
                            username3: (user3 || {}).username || '...',
                            exp1: utils.formatNumber(exp1),
                            exp2: utils.formatNumber(exp2),
                            exp3: utils.formatNumber(exp3),
                        })).catch(()=>{});

                        // resetta a 0 le statistiche base delle challenge
                        utils.each(leaderboard, function(index, stats){
                            var user = storage.getUser(stats.id);

                            if (!user) return;
                            if (!user.chats[mexData.chatId]) return;

                            user.chats[mexData.chatId].challengeWon = 0;
                            user.chats[mexData.chatId].challengeLost = 0;
                        });
                    }
                })
                .then(utils.promiseTimeout(500))
                .then(() => {

                    // elimina i dati del markup
                    markup.deleteData(query);  

                    // aggiunge gli utenti in coda per aggiornare il db
                    storage.addUserToQueue(userA.id);
                    storage.addUserToQueue(userB.id);

                    chat.isChallengeActive = false;
                })
                .catch(err => {
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

    // applica i bonus degli eventuali oggetti raccolti dell'utente e della chat
    var userItemsBuff = items.getItemsBuff(userStats.items);
    var chatItemsBuff = items.getItemsBuff(chat.items);
    expGain = BigNumber(expGain).multipliedBy(userItemsBuff.exp).multipliedBy(chatItemsBuff.exp);

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
                    ctx.replyWithMarkdown(lexicon.get('USER_LEVELUP', { username: user.username, level: utils.toFloor(newLevel) })).catch(()=>{});
                }, 500);
            }
        }

        // notifica l'utente se è sceso di livello
        if (BigNumber(utils.toFloor(userStats.level)).isGreaterThan(utils.toFloor(newLevel))) {
            if (chat.settings.notifyUserLevelup && BigNumber(userStats.prestige).isLessThan(2)) {
                setTimeout(function(){
                    ctx.replyWithMarkdown(lexicon.get('USER_LEVELDOWN', { username: user.username, level: utils.toFloor(newLevel) })).catch(()=>{});
                }, 500);
            }
        }
        
        // notifica l'utente che puo' prestigiare
        if (BigNumber(newExp).isGreaterThanOrEqualTo(nextPrestige) && userStats.prestigeAvailable == false) {
            userStats.prestigeAvailable = true;

            if (chat.settings.notifyUserPrestige) {
                setTimeout(function(){
                    ctx.replyWithMarkdown(lexicon.get('USER_PRESTIGE_AVAILABLE', { username: user.username, userid: user.id })).catch(()=>{});
                }, 500);
            }
        }

        // assegna i nuovi dati
        userStats.exp = BigNumber(newExp).valueOf();
        userStats.level = BigNumber(newLevel).valueOf();
        userStats.levelReached = BigNumber.maximum(userStats.levelReached, userStats.level).valueOf();
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
function dropItemChance(ctx, user){
    var lexicon = ctx.state.lexicon;
    var mexData = ctx.state.mexData;
    
    // ottiene il riferimento alla chat
    var chat = storage.getChat(mexData.chatId);
    // ottiene il riferimento alle stats dell'utente per la chat corrente
    var userStats = user.chats[mexData.chatId];
    // otiene la lista dei bonus degli eventuali oggetti della chat
    var chatItemsBuff = items.getItemsBuff(chat.items);
    // tempo di cooldown prima di poter droppare un altro oggetto
    var cooldownTime = (60 * 60 * 8) * chatItemsBuff.drop_cd;
    // chance di drop 
    var dropchance = (0.015 + userStats.itemsDropGrow) * chatItemsBuff.drop_chance;
    // determina se è in cooldown
    var notCoolingDown = userStats.lastItemDate + cooldownTime < (Date.now() / 1000);
    // determina se puo' droppare
    var canDrop = Math.random() < dropchance;

    // probabilità di ottenere un oggetto 
    if (notCoolingDown && canDrop) { 

        userStats.itemsDropGrow = 0;
        userStats.lastItemDate = (Date.now() / 1000);

        var dropText = '';
        var item = items.pickDrop();
        var checkForCraftableItem = function(){
            var newItem = items.checkForCraftableItem(userStats.items);
            if (newItem) {

                dropText += '\n\n\n' + lexicon.get('ITEMS_CRAFT_FULL', {
                    username: user.username,
                    recipe: newItem.recipe.map(i => i.quantity + 'x ' + lexicon.get('ITEMS_TITLE_' + i.name)).join(', '),
                    itemcard: getItemCardText(newItem, mexData.lang)
                });

                checkForCraftableItem();
            }
        };

        // inserisce il drop nella lista degli items dell'utente
        items.insertItemTo(userStats.items, item);

        // aggiunge il testo del drop
        dropText += lexicon.get('ITEMS_PICKUP_FULL', {
            username: user.username,
            itemcard: getItemCardText(item, mexData.lang)
        });

        checkForCraftableItem();

        // se la notifica di drop è abilitata
        if (chat.settings.notifyUserPickupItem) {
            ctx.replyWithMarkdown(dropText).catch(()=>{});
        }
    } else if (notCoolingDown) {
        userStats.itemsDropGrow += 0.00015;
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
 * 
 * @param {number} chatId id della chat di riferimento
 * @param {string} type tipo di leaderboard da mostrare
 */
function getLeaderboardByType(chatId, user, type){
    var lexicon = Lexicon.lang('en');
    var text = '';
    var getIcon = function(index){
        return index == 0 ? '🥇' : (index == 1 ? '🥈' : (index == 2 ? '🥉' : '' ));
    };

    // genera il testo della leaderboard a seconda del tipo scelto
    if (type == 'exp') {
        var leaderboard = storage.getChatUsers(chatId);
        var sortFunction = function(a, b){
            var c = BigNumber(b.exp).minus(a.exp);

            if (c.isGreaterThan(0)) c = 1;
            else if (c.isLessThan(0)) c = -1;
            else c = 0;

            return c;
        }

        text += lexicon.get('LEADERBOARD_OPTION_EXP_TITLE') + '\n';

        // (a, b) => b.exp - a.exp
        utils.each(leaderboard.sort(sortFunction), function(index, stats){
            text += '\n' + lexicon.get('LEADERBOARD_OPTION_EXP_ENTRY', {
                icon: getIcon(index),
                position: index + 1,
                username: stats.username,
                prestige: stats.prestige,
                level: utils.formatNumber(utils.toFloor(stats.level)),
                exp: utils.formatNumber(stats.exp)
            });
        });
    } else if (type == 'absexp') {
        var leaderboard = storage.getChatUsers(chatId);
        var sortFunction = function(a, b){
            var c1 = BigNumber(b.prestige).minus(a.prestige);
            var c2 = BigNumber(b.exp).minus(a.exp);

            if (c1.isGreaterThan(0)) c1 = 1;
            else if (c1.isLessThan(0)) c1 = -1;
            else c1 = 0;

            if (c2.isGreaterThan(0)) c2 = 1;
            else if (c2.isLessThan(0)) c2 = -1;
            else c2 = 0;

            return c1 || c2;
        }

        text += lexicon.get('LEADERBOARD_OPTION_ABSEXP_TITLE') + '\n';

        // (a, b)=> (b.prestige - a.prestige) || (b.exp - a.exp)
        utils.each(leaderboard.sort(sortFunction), function(index, stats){
            text += '\n' + lexicon.get('LEADERBOARD_OPTION_ABSEXP_ENTRY', {
                icon: getIcon(index),
                position: index + 1,
                username: stats.username,
                prestige: stats.prestige,
                level: utils.formatNumber(utils.toFloor(stats.level)),
                exp: utils.formatNumber(stats.exp)
            });
        });
    } else if (type === 'chratio'){
        var leaderboard = storage.getChatUsers(chatId);
        var sortFunction = function(a, b){
            var c = BigNumber(b.challengePoints).minus(a.challengePoints);

            if (c.isGreaterThan(0)) c = 1;
            else if (c.isLessThan(0)) c = -1;
            else c = 0;

            return c;
        }

        text += lexicon.get('LEADERBOARD_OPTION_CHRATIO_TITLE') + '\n';

        // (a, b) => b.chratio - a.chratio
        utils.each(leaderboard.sort(sortFunction), function(index, stats){
            if (stats.challengeWon + stats.challengeLost === 0) return;

            text += '\n' + lexicon.get('LEADERBOARD_OPTION_CHRATIO_ENTRY', {
                icon: getIcon(index),
                position: index + 1,
                username: stats.username,
                won: stats.challengeWon,
                lost: stats.challengeLost,
                challengePoints: stats.challengePoints.toFixed(0)
            });
        });
    } else if (type === 'chsummary'){

        if (!user) return '';

        var leaderboard = [];
        var userStats = user.chats[chatId];
        var sortFunction = function(a, b){
            var c = BigNumber(b.chratio).minus(a.chratio);

            if (c.isGreaterThan(0)) c = 1;
            else if (c.isLessThan(0)) c = -1;
            else c = 0;

            return c;
        }

        if (!userStats) return '';

        utils.each(userStats.challengers, function(username, stats){
            leaderboard.push({ 
                username: username,  
                challengeWon: stats.won,
                challengeLost: stats.lost,
                chratio: stats.won / (stats.lost || 1)
            });
        }); 

        text += lexicon.get('LEADERBOARD_OPTION_CHSUMMARY_TITLE', { username: user.username }) + '\n';

        // (a, b) => b.chratio - a.chratio
        utils.each(leaderboard.sort(sortFunction), function(index, stats){
            text += '\n' + lexicon.get('LEADERBOARD_OPTION_CHSUMMARY_ENTRY', {
                username: stats.username,
                won: stats.challengeWon,
                lost: stats.challengeLost,
                ratio: stats.chratio.toFixed(2)
            });
        });
    }

    return text;
}

/**
 * 
 * @param {object} item oggetto dell'item
 * @param {string} lang lingua da usare nel lexicon
 */
function getItemCardText(item, lang = 'en', instPassive = false, data = {}){
    var lexicon = Lexicon.lang(lang);
    var itemBonusText = '';

    if (item.type === 'inst') {
        var bonusExpGain = calcUserExpGain(data.ctx, data.user, item.messages, instPassive);

        itemBonusText = '+' + utils.formatNumber(bonusExpGain);
    } else {
        itemBonusText = items.getItemBuffText(item);
    }

    return lexicon.get('ITEMS_CARD_FULL', {
        itemicon: items.getItemRarityIcon(item.name),
        itemname: lexicon.get('ITEMS_TITLE_' + item.name) + ( item.timeout ? '  (' + item.timeout + 'h)' : ''),
        itemdescription: lexicon.get('ITEMS_DESCRIPTION_' + item.name),
        itemtype: lexicon.get('LABEL_ITEMTYPE_' + item.type.toUpperCase()),
        itemchance: utils.formatNumber(item.chance * 100) + '%',
        itembonus: itemBonusText + ' ' + lexicon.get('ITEMS_LIST_TARGET_' + item.target.toUpperCase())
    }); 
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
    .then(startSite)
    .then(() => {
        
        // Avvia il bot
        bot.launch().then(() => {

            // imposta una variabile clobale per indicare che il bot è stato lanciato
            global.botRunning = true;

            // controlla se è stato aggiornata la versione del bot dall'ultimo riavvio ed in caso manda una notifica a tutte le chat
            checkIfUpdated();

            console.log('-----\nBot running!');


                    //// ottiene il riferimento alle stats dell'utente per la chat corrente
                    //var userStats = storage.getUser(357270868).chats['-553783828'];
//
                    //// inserisce l'oggetto nella lista dell'utente
                    //items.insertItemTo(userStats.items, items.get('POISON'));
                    //items.insertItemTo(userStats.items, items.get('SHIT'));

                
                // droppa un item casuale di debuff
                //var monsterItem = items.pickMonster();
                //var chat = storage.getChat('-553783828')
                //// aggiunge l'item droppato alla chat
                //items.insertItemTo(chat.items, monsterItem);

        });

    })
    .catch(err => {

        // Errore
        utils.errorlog('Global catch:');
        console.log(err.message);
        console.log(err.stack);
    });
}

// inizializza il bot
init();

//setTimeout(() => {
//    scheduler.trigger('monster');
//}, 3000);

// messages.q('sendMessage', {
//     userId: 13112141
// });

