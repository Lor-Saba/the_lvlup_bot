
// modulo con vari metodi di utilità
const utils = require('../utils');
// modulo per schedulare eventi nel tempo
const schedule = require('node-schedule');
// eventi richiesti salvati
var eventsList = {};
// lista di eventi da schedulare
var scheduleMap = [
    // “At 10:00 on Sunday.” 
    { rule: '0 10 * * 0', type: 'boss' },
    // “At 10:00 on Tuesday and Thursday.” 
    { rule: '0 10 * * 2,4', type: 'dungeon' },
    // “At 00:00 on day-of-month 25 in December.” 
    { rule: '0 0 25 12 *', type: 'xmas' },
    // “At 02:00.” 
    { rule: '* * * * *', type: 'backup' }, // '0 2 * * *'
    // “At 08:00 on every day-of-week from Monday through Friday.” 
    { rule: '0 8 * * 1-5', type: 'daily' }
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


// genera la lista di eventi da controllare
utils.each(scheduleMap, function(indexItem, item){
    schedule.scheduleJob(item.rule, () => {
        if (!eventsList[type]) return;
        if (!global.botRunning) return; 
        
        utils.each(eventsList[type].fn, (indexEvent, event) => event());
    });
});

// live cron schedule expressions tester
// https://crontab.guru/#0_10_*_*_0
module.exports = {
    on
}