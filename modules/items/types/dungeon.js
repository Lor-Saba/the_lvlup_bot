module.exports = [


    // DAMAGE - permanenti

    { target: 'attack_damage', type: 'perm', name: 'BALOON',      weight: 100, power: 0.009, powermode: '+' }, 
    { target: 'attack_damage', type: 'perm', name: 'BUTTERKNIFE', weight: 100, power: 0.010, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'BCKWATER',    weight: 90,  power: 0.011, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODENSWORD', weight: 90,  power: 0.012, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PILLOW',      weight: 70,  power: 0.015, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'DUCK',        weight: 65,  power: 0.016, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'GLASS',       weight: 60,  power: 0.017, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODOODOLL',  weight: 50,  power: 0.018, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'OUIJA',       weight: 50,  power: 0.020, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'DOUBLESWORD', weight: 48,  power: 0.024, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PEPPERSPRAY', weight: 35,  power: 0.030, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'SLINGSHOT',   weight: 30,  power: 0.038, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PICKAXE',     weight: 12,  power: 0.055, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'SCYTHE',      weight: 10,  power: 0.062, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODLASER',   weight: 10,  power: 0.065, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'KATANA',      weight: 7,   power: 0.080, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'BCKLAVA',     weight: 5,   power: 0.090, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PISTOL',      weight: 3,   power: 0.100, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'BAZOOKA',     weight: 1,   power: 0.125, powermode: '+' },


    // EXP - instantanei

    { target: 'exp', type: 'inst', name: 'BAG',      weight: 125, messages: 7  },
    { target: 'exp', type: 'inst', name: 'CHEST',    weight: 80,  messages: 15 },
    { target: 'exp', type: 'inst', name: 'TREASURE', weight: 45,  messages: 30 },


    // EXP - temporanei

    { target: 'exp', type: 'temp', name: 'ELIXIR',     weight: 25, power: 1.25, powermode: '*', timeout: 12 },
    { target: 'exp', type: 'temp', name: 'MEGAELIXIR', weight: 10, power: 1.50, powermode: '*', timeout: 8  },
    { target: 'exp', type: 'temp', name: 'POISON',     weight: 15, power: 0.80, powermode: '*', timeout: 12 },
    { target: 'exp', type: 'temp', name: 'SHIT',       weight: 5,  power: 0.65, powermode: '*', timeout: 6  }
];