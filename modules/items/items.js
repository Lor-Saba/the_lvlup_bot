module.exports = [

    
    // istantanei

    { type: 'inst', droppable: true, name: 'BAG',      weight: 165, messages: 5  },
    { type: 'inst', droppable: true, name: 'CHEST',    weight: 70,  messages: 12 },
    { type: 'inst', droppable: true, name: 'TREASURE', weight: 35,  messages: 20 },


    // permanenti

    { type: 'perm', droppable: true, name: 'DAISY',     weight: 100, power: 0.01  },
    { type: 'perm', droppable: true, name: 'STONE',     weight: 100, power: 0.01  },
    { type: 'perm', droppable: true, name: 'BANANA',    weight: 100, power: 0.01  },
    { type: 'perm', droppable: true, name: 'PINEAPPLE', weight: 100, power: 0.01  },
    { type: 'perm', droppable: true, name: 'APPLE',     weight: 70,  power: 0.012 },
    { type: 'perm', droppable: true, name: 'SAUCE',     weight: 60,  power: 0.015 },
    { type: 'perm', droppable: true, name: 'SAUSAGE',   weight: 50,  power: 0.018 },
    { type: 'perm', droppable: true, name: 'STICK',     weight: 45,  power: 0.02  },
    { type: 'perm', droppable: true, name: 'CRYSTAL',   weight: 25,  power: 0.05  },
    { type: 'perm', droppable: true, name: 'SUSEYE',    weight: 2,   power: 0.15  },
    { type: 'perm', droppable: true, name: 'DRAGONEGG', weight: 1,   power: 0.25  },
    { type: 'perm', droppable: true, name: 'RTX3090',   weight: 0.5, power: 0.30  },


    // temporanei

    { type: 'temp', droppable: true, name: 'ELIXIR',     weight: 25, power: 1.3, timeout: 8  },
    { type: 'temp', droppable: true, name: 'MEGAELIXIR', weight: 15, power: 1.5, timeout: 12 },
    { type: 'temp', droppable: true, name: 'SHIT',       weight: 15, power: 0.7, timeout: 1  }
];