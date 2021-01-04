module.exports = [


    // per challenge vinte (buff moltiplicatore exp per le vittorie)
    // FORMULA: (1 + power) * winMessages

    { target: 'ch_win', name: 'CHW_1', type: 'perm', power: 0.20, powermode: '+', for: [10, 25, 50, 150, 200, 250, 750, 1000, 1250] },
    { target: 'ch_win', name: 'CHW_2', type: 'perm', power: 0.40, powermode: '+', for: [100, 500, 1500] },
    { target: 'ch_win', name: 'CHW_3', type: 'perm', power: 0.50, powermode: '+', for: [1750, 2000] },
    { target: 'ch_win', name: 'CHW_4', type: 'perm', power: 1.00, powermode: '+', for: [3000] },


    // per challenge perse (debuff moltiplicatore exp per le sconfitte)
    // FORMULA: (1 - power) * loseMessages

    { target: 'ch_lose', name: 'CHL_1', type: 'perm', power: 0.015, powermode: '-', for: [10, 25, 50, 100, 150, 200, 250, 500, 750, 1000, 1250] },
    { target: 'ch_lose', name: 'CHL_2', type: 'perm', power: 0.020, powermode: '-', for: [1500, 1750] },
    { target: 'ch_lose', name: 'CHL_3', type: 'perm', power: 0.040, powermode: '-', for: [2000, 3000] },


    // per challenge effettuate in totale (diminuzione cooldown)
    // FORMULA: (1 - power) * cooldown

    { target: 'ch_cd', name: 'CHT_1', type: 'perm', power: 0.050, powermode: '-',for: [50, 100] },
    { target: 'ch_cd', name: 'CHT_2', type: 'perm', power: 0.075, powermode: '-',for: [200, 500] },
    { target: 'ch_cd', name: 'CHT_3', type: 'perm', power: 0.100, powermode: '-',for: [1000, 2500] },
    { target: 'ch_cd', name: 'CHT_4', type: 'perm', power: 0.175, powermode: '-',for: [3000, 5000] }

];