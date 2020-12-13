module.exports = [

    
    // istantanei

    { type: 'inst', droppable: true, name: 'BAG',      weight: 165, messages: 5  },
    { type: 'inst', droppable: true, name: 'CHEST',    weight: 70,  messages: 12 },
    { type: 'inst', droppable: true, name: 'TREASURE', weight: 35,  messages: 20 },


    // permanenti

    { type: 'perm', droppable: true,  name: 'DUST',       weight: 90,  power: 0.008, craft: ['DUSTBALL']  },
    { type: 'perm', droppable: true,  name: 'DAISY',      weight: 100, power: 0.010, craft: ['BOUQUET'] },
    { type: 'perm', droppable: true,  name: 'STONE',      weight: 100, power: 0.010, craft: ['CAIRN'] },
    { type: 'perm', droppable: true,  name: 'STRAWBERRY', weight: 100, power: 0.010, craft: ['MACEDONIA'] },
    { type: 'perm', droppable: true,  name: 'BANANA',     weight: 100, power: 0.010, craft: ['MACEDONIA'] },
    { type: 'perm', droppable: true,  name: 'PINEAPPLE',  weight: 100, power: 0.010, craft: ['MACEDONIA'] },
    { type: 'perm', droppable: true,  name: 'APPLE',      weight: 70,  power: 0.012, craft: ['MACEDONIA'] },
    { type: 'perm', droppable: true,  name: 'STRING',     weight: 70,  power: 0.012, craft: ['ROPE', 'BOOK'] },
    { type: 'perm', droppable: true,  name: 'PAPER',      weight: 60,  power: 0.015, craft: ['BOOK'] },
    { type: 'perm', droppable: true,  name: 'SAUCE',      weight: 60,  power: 0.015, craft: ['BBQ'] },
    { type: 'perm', droppable: true,  name: 'SAUSAGE',    weight: 50,  power: 0.018, craft: ['BBQ'] },
    { type: 'perm', droppable: true,  name: 'STICK',      weight: 35,  power: 0.020, craft: ['BBQ'] },
    { type: 'perm', droppable: true,  name: 'CRYSTAL',    weight: 10,  power: 0.050, craft: ['DIAMOND'] },
    { type: 'perm', droppable: true,  name: 'SUSEYE',     weight: 3,   power: 0.100 },
    { type: 'perm', droppable: true,  name: 'DRAGONEGG',  weight: 2,   power: 0.150 },
    { type: 'perm', droppable: true,  name: 'RTX3090',    weight: 1,   power: 0.200 },
    { type: 'perm', droppable: false, name: 'DUSTBALL',   weight: 0,   power: 0.065, recipe: [{ name: 'DUST', quantity: 5 }] },
    { type: 'perm', droppable: false, name: 'BOOK',       weight: 0,   power: 0.065, recipe: [{ name: 'PAPER', quantity: 3 },{ name: 'STRING', quantity: 1 }] },
    { type: 'perm', droppable: false, name: 'BOUQUET',    weight: 0,   power: 0.050, recipe: [{ name: 'DAISY', quantity: 4 }] },
    { type: 'perm', droppable: false, name: 'ROPE',       weight: 0,   power: 0.045, recipe: [{ name: 'STRING', quantity: 3 }] },
    { type: 'perm', droppable: false, name: 'CAIRN',      weight: 0,   power: 0.040, recipe: [{ name: 'STONE', quantity: 3 }] },
    { type: 'perm', droppable: false, name: 'MACEDONIA',  weight: 0,   power: 0.060, recipe: [{ name: 'STRAWBERRY', quantity: 1 },{ name: 'BANANA', quantity: 1 },{ name: 'PINEAPPLE', quantity: 1 },{ name: 'APPLE', quantity: 1 }] },
    { type: 'perm', droppable: false, name: 'BBQ',        weight: 0,   power: 0.110, recipe: [{ name: 'SAUCE', quantity: 1 },{ name: 'SAUSAGE', quantity: 2 },{ name: 'STICK', quantity: 2 }] },
    { type: 'perm', droppable: false, name: 'DIAMOND',    weight: 0,   power: 0.200, recipe: [{ name: 'CRYSTAL', quantity: 3 }] },

    // temporanei

    //{ type: 'temp', droppable: true, name: 'ELIXIR',     weight: 25, power: 1.3, timeout: 8  },
    //{ type: 'temp', droppable: true, name: 'MEGAELIXIR', weight: 10, power: 1.5, timeout: 12 },
    //{ type: 'temp', droppable: true, name: 'SHIT',       weight: 11, power: 0.7, timeout: 1  }
];