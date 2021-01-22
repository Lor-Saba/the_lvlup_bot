module.exports = [

    { target: 'exp', type: 'perm', name: 'DUST',         weight: 90,  power: 0.008, powermode: '+', craft: ['DUSTBALL']  },
    { target: 'exp', type: 'perm', name: 'DAISY',        weight: 100, power: 0.010, powermode: '+', craft: ['BOUQUET'] },
    { target: 'exp', type: 'perm', name: 'STONE',        weight: 100, power: 0.010, powermode: '+', craft: ['CAIRN'] },
    { target: 'exp', type: 'perm', name: 'STRAWBERRY',   weight: 100, power: 0.010, powermode: '+', craft: ['MACEDONIA'] },
    { target: 'exp', type: 'perm', name: 'BANANA',       weight: 100, power: 0.010, powermode: '+', craft: ['MACEDONIA', 'BANANASBUNCH'] },
    { target: 'exp', type: 'perm', name: 'PINEAPPLE',    weight: 100, power: 0.010, powermode: '+', craft: ['MACEDONIA'] },
    { target: 'exp', type: 'perm', name: 'APPLE',        weight: 70,  power: 0.012, powermode: '+', craft: ['MACEDONIA'] },
    { target: 'exp', type: 'perm', name: 'STRING',       weight: 70,  power: 0.012, powermode: '+', craft: ['ROPE', 'BOOK'] },
    { target: 'exp', type: 'perm', name: 'PAPER',        weight: 60,  power: 0.015, powermode: '+', craft: ['BOOK'] },
    { target: 'exp', type: 'perm', name: 'SAUCE',        weight: 60,  power: 0.015, powermode: '+', craft: ['BBQ'] },
    { target: 'exp', type: 'perm', name: 'SAUSAGE',      weight: 50,  power: 0.018, powermode: '+', craft: ['BBQ'] },
    { target: 'exp', type: 'perm', name: 'STICK',        weight: 35,  power: 0.020, powermode: '+', craft: ['BBQ'] },
    { target: 'exp', type: 'perm', name: 'CRYSTAL',      weight: 10,  power: 0.050, powermode: '+', craft: ['DIAMOND'] },
    { target: 'exp', type: 'perm', name: 'SUSEYE',       weight: 3,   power: 0.100, powermode: '+' },
    { target: 'exp', type: 'perm', name: 'DRAGONEGG',    weight: 2,   power: 0.150, powermode: '+' },
    { target: 'exp', type: 'perm', name: 'RTX3090',      weight: 1,   power: 0.200, powermode: '+' },
    { target: 'exp', type: 'perm', name: 'DUSTBALL',     weight: 0,   power: 0.050, powermode: '+', recipe: [{ name: 'DUST', quantity: 5 }] },
    { target: 'exp', type: 'perm', name: 'BOOK',         weight: 0,   power: 0.065, powermode: '+', recipe: [{ name: 'PAPER', quantity: 3 },{ name: 'STRING', quantity: 1 }] },
    { target: 'exp', type: 'perm', name: 'BOUQUET',      weight: 0,   power: 0.050, powermode: '+', recipe: [{ name: 'DAISY', quantity: 4 }] },
    { target: 'exp', type: 'perm', name: 'ROPE',         weight: 0,   power: 0.045, powermode: '+', recipe: [{ name: 'STRING', quantity: 3 }] },
    { target: 'exp', type: 'perm', name: 'CAIRN',        weight: 0,   power: 0.040, powermode: '+', recipe: [{ name: 'STONE', quantity: 3 }] },
    { target: 'exp', type: 'perm', name: 'MACEDONIA',    weight: 0,   power: 0.060, powermode: '+', recipe: [{ name: 'STRAWBERRY', quantity: 1 },{ name: 'BANANA', quantity: 1 },{ name: 'PINEAPPLE', quantity: 1 },{ name: 'APPLE', quantity: 1 }] },
    { target: 'exp', type: 'perm', name: 'BBQ',          weight: 0,   power: 0.110, powermode: '+', recipe: [{ name: 'SAUCE', quantity: 1 },{ name: 'SAUSAGE', quantity: 2 },{ name: 'STICK', quantity: 2 }] },
    { target: 'exp', type: 'perm', name: 'DIAMOND',      weight: 0,   power: 0.200, powermode: '+', recipe: [{ name: 'CRYSTAL', quantity: 3 }] },
    { target: 'exp', type: 'perm', name: 'BANANASBUNCH', weight: 0,   power: 0.045, powermode: '+', recipe: [{ name: 'BANANA', quantity: 3 }] }
    
];