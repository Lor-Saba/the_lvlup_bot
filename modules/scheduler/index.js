
// modulo con vari metodi di utilità
const utils = require('../utils');
// modulo per schedulare eventi nel tempo
const schedule = require('node-schedule');
// eventi richiesti salvati
var eventsList = {};
// lista di eventi da schedulare
var scheduleMap = [
    // “At 10:00 on Sunday.” 
    { rule: '0 9 * * 0', type: 'monster' },
    // “At 13:00 on Tuesday and Thursday.” 
    { rule: '55 20 * * 2,4', type: 'dungeon' },
    // “At 00:00 on day-of-month 25 in December.” 
    { rule: '0 0 25 12 *', type: 'xmas' },
    // “At 10:00 on day-of-month 1 in April.” 
    { rule: '0 10 1 4 *', type: 'aprilfool' },
    // “At 10:00 on day-of-month 31 in October.” 
    { rule: '0 10 31 10 *', type: 'halloween' },
    // “At 01:00.” 
    { rule: '0 1 * * *', type: 'backup' },
    // “At 08:00 on every day-of-week from Monday through Friday.” 
    { rule: '0 8 * * 1-5', type: 'daily' },
    // “At minute 0.” 
    { rule: '0 * * * *', type: 'dbsync' },
    // “At minute 0 on Monday.” 
    { rule: '0 * * * 1', type: 'checkoldchat' }
];


/**
 * Salva una richiesta di evento
 * 
 * @param {string} type tipo di evento
 * @param {function} callback funzione di callback
 */
function on(type, callback){

    if (!eventsList[type]) {
        eventsList[type] = { type: type, fn: [] };
    }

    eventsList[type].fn.push(callback);
}

/**
 * Forza l'esecuzione di uno degli eventi schedulati
 * 
 * @param {string} type tipo di evento da eseguire
 */
function trigger(type){

    utils.log('SCHEDULER EXEC BEFORE:', JSON.stringify({ 
        type: type, 
        fn_count: (eventsList[type] ? eventsList[type].fn.length : 0),
        bot_running: !global.botRunning
    }));

    if (!eventsList[type]) return;
    if (!global.botRunning) return; 

    utils.log('SCHEDULER EXEC AFTER');
    
    utils.each(eventsList[type].fn, (indexEvent, event) => event());
}


// genera la lista di eventi da controllare
utils.each(scheduleMap, function(indexItem, item){
    schedule.scheduleJob(item.rule, () => trigger(item.type));
    // schedule.scheduleJob({ rule: item.rule, tz: 'GMT+2' }, () => trigger(item.type));
});

// live cron schedule expressions tester
// https://crontab.guru/#0_10_*_*_0
module.exports = {
    on,
    trigger
}