module.exports = {
    id: null, 
    title: "<unknown>",
    isChallengeActive: false,
    effects: {},
    monster: {
        active: false,
        spawnDate: 0,
        level: 1,
        health: 0,
        attackers: {}
    },
    dungeon: {
        active: false,
        spawnDate: 0,
        users: {}
    },
    settings: {
        notifyPenality: true,
        notifyUserLevelup: true,
        notifyUserPrestige: true,
        notifyUserPickupItem: "full"
    }
}