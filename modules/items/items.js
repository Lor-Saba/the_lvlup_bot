module.exports = [

    /*
        ⬜️ 100 - 70
        🟩 70 - 40
        🟦 40 - 15
        🟪 15 - 5
        🟧 5 - 0
    */


    // istantanei

    { type: 'inst', name: 'BAG',      weight: 165, messages: 5  },
    { type: 'inst', name: 'CHEST',    weight: 70,  messages: 12 },
    { type: 'inst', name: 'TREASURE', weight: 35,  messages: 20 },


    // permanenti

    { type: 'perm', name: 'DAISY',     weight: 100, power: 0.01  },
    { type: 'perm', name: 'STONE',     weight: 100, power: 0.01  },
    { type: 'perm', name: 'BANANA',    weight: 100, power: 0.01  },
    { type: 'perm', name: 'PINEAPPLE', weight: 100, power: 0.01  },
    { type: 'perm', name: 'APPLE',     weight: 70,  power: 0.012 },
    { type: 'perm', name: 'SAUCE',     weight: 60,  power: 0.015 },
    { type: 'perm', name: 'SAUSAGE',   weight: 50,  power: 0.018 },
    { type: 'perm', name: 'STICK',     weight: 45,  power: 0.02  },
    { type: 'perm', name: 'CRYSTAL',   weight: 25,  power: 0.05  },
    { type: 'perm', name: 'SUSEYE',    weight: 1,   power: 0.15  },
    { type: 'perm', name: 'DRAGONEGG', weight: 0.5, power: 0.25  },
    { type: 'perm', name: 'RTX3090',   weight: 0.2, power: 0.45  },


    // temporanei

    { type: 'temp', name: 'ELIXIR',     weight: 30, power: 1.3, timeout: 8  },
    { type: 'temp', name: 'MEGAELIXIR', weight: 15, power: 1.5, timeout: 12 },
    { type: 'temp', name: 'POISON',     weight: 20, power: 0.5, timeout: 6  },
    { type: 'temp', name: 'SHIT',       weight: 30, power: 0.7, timeout: 1  }
];