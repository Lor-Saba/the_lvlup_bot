module.exports = [


    // DAMAGE - permanenti

    { target: 'attack_damage', type: 'perm', name: 'BALOON',      weight: 100, power: 0.008, powermode: '+' }, 
    { target: 'attack_damage', type: 'perm', name: 'BUTTERKNIFE', weight: 90,  power: 0.010, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODENSWORD', weight: 80,  power: 0.012, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PILLOW',      weight: 60,  power: 0.015, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'WOODOODOLL',  weight: 40,  power: 0.020, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PEPPERSPRAY', weight: 35,  power: 0.040, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PICKAXE',     weight: 20,  power: 0.075, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'SCYTHE',      weight: 15,  power: 0.080, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'KATANA',      weight: 9,   power: 0.100, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'PISTOL',      weight: 7,   power: 0.110, powermode: '+' },
    { target: 'attack_damage', type: 'perm', name: 'BAZOOKA',     weight: 3,   power: 0.155, powermode: '+' },


    // EXP - instantanei

    { target: 'exp', type: 'inst', name: 'BAG',      weight: 165, messages: 5  },
    { target: 'exp', type: 'inst', name: 'CHEST',    weight: 70,  messages: 12 },
    { target: 'exp', type: 'inst', name: 'TREASURE', weight: 35,  messages: 25 },


    // EXP - temporanei

    { target: 'exp', type: 'temp', name: 'ELIXIR',     weight: 25, power: 1.25, powermode: '*', timeout: 12 },
    { target: 'exp', type: 'temp', name: 'MEGAELIXIR', weight: 10, power: 1.50, powermode: '*', timeout: 8  },
    { target: 'exp', type: 'temp', name: 'POISON',     weight: 15, power: 0.80, powermode: '*', timeout: 12 },
    { target: 'exp', type: 'temp', name: 'SHIT',       weight: 5,  power: 0.65, powermode: '*', timeout: 6  }
];