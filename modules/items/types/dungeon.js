module.exports = [


    // DAMAGE - permanenti

    { target: 'attack_damage', type: 'perm', name: 'BALOON',      weight: 110, power: 0.008, powermode: '+' }, 
    { target: 'attack_damage', type: 'perm', name: 'BUTTERKNIFE', weight: 100, power: 0.010, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODENSWORD', weight: 90,  power: 0.012, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PILLOW',      weight: 70,  power: 0.015, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODOODOLL',  weight: 50,  power: 0.018, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PEPPERSPRAY', weight: 35,  power: 0.030, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PICKAXE',     weight: 12,  power: 0.055, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'SCYTHE',      weight: 10,  power: 0.065, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'KATANA',      weight: 7,   power: 0.080, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PISTOL',      weight: 3,   power: 0.100, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'BAZOOKA',     weight: 1,   power: 0.125, powermode: '+' },


    // EXP - instantanei

    { target: 'exp', type: 'inst', name: 'BAG',      weight: 170, messages: 5  },
    { target: 'exp', type: 'inst', name: 'CHEST',    weight: 70,  messages: 12 },
    { target: 'exp', type: 'inst', name: 'TREASURE', weight: 39,  messages: 25 },


    // EXP - temporanei

    { target: 'exp', type: 'temp', name: 'ELIXIR',     weight: 25, power: 1.25, powermode: '*', timeout: 12 },
    { target: 'exp', type: 'temp', name: 'MEGAELIXIR', weight: 10, power: 1.50, powermode: '*', timeout: 8  },
    { target: 'exp', type: 'temp', name: 'POISON',     weight: 15, power: 0.80, powermode: '*', timeout: 12 },
    { target: 'exp', type: 'temp', name: 'SHIT',       weight: 5,  power: 0.65, powermode: '*', timeout: 6  }
];