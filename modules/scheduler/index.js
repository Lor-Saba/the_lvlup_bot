
// modulo con vari metodi di utilità
const utils = require('../utils');
// modulo per schedulare eventi nel tempo
const schedule = require('node-schedule');
// eventi richiesti salvati
var eventsList = {};
// lista di eventi da schedulare
var scheduleMap = [
    // “At 12:00 on Sunday.” 
    { rule: '0 13 * * 0', type: 'monster' },
    // “At 12:00 on Monday, Wednesday, and Friday.” 
    { rule: '0 13 * * 1,3,5', type: 'dungeon' },
    // “At 11:00 on Saturday.” 
    { rule: '0 10 * * 6', type: 'randomevent' },
    // “At 08:00 on every day-of-week from Monday through Friday.” 
    { rule: '0 13,18 * * 1-5', type: 'riddles' },
    // “At 00:00 on day-of-month 25 in December.” 
    { rule: '0 0 25 12 *', type: 'xmas' },
    // “At 10:17 on day-of-month 1 in April.” 
    { rule: '17 10 1 4 *', type: 'aprilfool' },
    // “At 10:00 on day-of-month 31 in October.” 
    { rule: '0 11 31 10 *', type: 'halloween' },
    // “At 01:00.” 
    { rule: '0 1 * * *', type: 'backup' },
    // “At 08:00 on every day-of-week from Monday through Friday.” 
    { rule: '0 8 * * 1-5', type: 'daily' },
    // “At minute 0.” 
    { rule: '0 * * * *', type: 'dbsync' },
    // “At 00:30 on Monday.” 
    { rule: '30 0 * * 1', type: 'checkchatvitality' }
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

    if (eventsList[type]) {
        utils.each(eventsList[type].fn, (indexEvent, event) => event());
    }
}

function parseRule(ruleString){

    var ruleSplit = ruleString.split(/\s/g);
    var rule = new schedule.RecurrenceRule();

    var parseValue = function(value){

        if (value == '*') return null;

        var result = value.split(/\,/g);

        utils.each(result, function(index, val){
            var valSplit = val.split(/\-/g);

            if (valSplit.length > 1) {
                result[index] = new schedule.Range(...valSplit);
            } else {
                result[index] = Number(val);
            }
        });

        if (result.length == 1) {
            result = result[0];
        }

        return result;
    };

    /*
        minute (0-59)
        hour (0-23)
        date (1-31)
        month (0-11)
        dayOfWeek (0-6) Starting with Sunday
    */

    rule.minute = parseValue(ruleSplit[0]);
    rule.hour = parseValue(ruleSplit[1]);
    rule.date = parseValue(ruleSplit[2]);
    rule.month = parseValue(ruleSplit[3]);
    rule.dayOfWeek = parseValue(ruleSplit[4]);
    rule.tz = 'Europe/Rome';

    return rule;
}

// genera la lista di eventi da controllare
utils.each(scheduleMap, function(indexItem, item){
    schedule.scheduleJob(parseRule(item.rule), () => trigger(item.type));
    // schedule.scheduleJob({ rule: item.rule, tz: 'GMT+2' }, () => trigger(item.type));
});

// live cron schedule expressions tester
// https://crontab.guru/#0_10_*_*_0
module.exports = {
    on,
    trigger
}