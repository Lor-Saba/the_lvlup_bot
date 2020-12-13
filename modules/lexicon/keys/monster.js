module.exports = {
     
    "MONSTER_SPAWN": {
        "en": "..the ground is shaking, a monster has appeared!\n\n_(Work together to take it down, or just ignore and let it pass.)_"
    },
    "MONSTER_START": {
        "en": "*$(username)* angered the monster!\n\n_(You have 8h to defeat it or you will pay the consequences.)_"
    },
    "MONSTER_MESSAGE": {
        "en": "👹 *Monster*\n\nLevel:  `$(level)`\nHealth:  `$(health) / $(healthmax)`   _($(healthPercentage)%)_\n$(healthbar)\n\nAttacks:\n$(attackers)"
    },
    "MONSTER_MESSAGE_ATTACKER": {
        "en": "  - *$(username)*  _x$(count)_  `$(damage) Dmg`"
    },
    "MONSTER_DEFEATED": {
        "en": "💀 The Monster has been defeated!\n\nRewards:\n$(usersrewards)"
    },
    "MONSTER_DEFEATED_ATTACKER": {
        "en": "  - *$(username)*  `+$(reward) Exp`"
    },
    "MONSTER_ATTACK_COOLDOWN": {
        "en": "Wait!\nYou can attack again in $(time)"
    },
    "MONSTER_ESCAPED": {
        "en": "The monster survived.\nEnraged by what had happened, he placed a curse on the group before fleeing.\n\n$(effectcard)"
    },
    "MONSTER_ATTACK_LABEL": {
        "en": "⚔️ Attack! ⚔️"
    },
    "MONSTER_OLD_MESSAGE": {
        "en": "_This monster is no longer a threat._"
    }
};