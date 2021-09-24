module.exports = {
     
    "MONSTER_SPAWN": {
        "en": "..the ground is shaking, a monster has appeared!\n\n_(Work together to take it down, or just ignore and let it pass.)_"
    },
    "MONSTER_START": {
        "en": "*$(username)* angered the monster!\n\n_(You have 8h to defeat it or you will pay the consequences.)_"
    },
    "MONSTER_MESSAGE": {
        "en": "$(icon) *Monster*\n\nLevel:  `$(level)`\nHealth:  `$(health) / $(healthmax)`   _($(healthPercentage)%)_\n$(healthbar)\n\nAttacks:\n$(attackers)"
    },
    "MONSTER_MESSAGE_ATTACKER": {
        "en": "  - $(icon) *$(username)*  _x$(count)_  `$(damage) Dmg`"
    },
    "MONSTER_DEFEATED": {
        "en": "💀 The Monster has been defeated!\n\nRewards:\n$(usersrewards)"
    },
    "MONSTER_DEFEATED_ATTACKER": {
        "en": "  - $(icon) *$(username)*  `+$(reward) Exp`"
    },
    "MONSTER_ATTACK_COOLDOWN": {
        "en": "Wait!\nYou can attack again in $(time)"
    },
    "MONSTER_ESCAPED": {
        "en": "The monster survived.\nEnraged by what had happened, the \"Lord of Dungeon\" casted a strong curse to avenge the monster..\n\n🌀 _$(itemname)_\n\n$(value)  for  $(timeout)h"
    },
    "MONSTER_STARTFIGHT_LABEL": {
        "en": "⚔️ Start Fighting! ⚔️"
    },
    "MONSTER_ATTACK_LABEL": {
        "en": "Strike! 🗡"
    },
    "MONSTER_AUTOATTACK_LABEL": {
        "en": "Send clone to battle 🤖"
    },
    "MONSTER_AUTOATTACK_ENABLED": {
        "en": "Auto attack is now enabled!\nFrom now on you will attack the monster automatically.\nIn case of victory, however, you will get half the experience.\n\nCannot be deactivated."
    },
    "MONSTER_AUTOATTACK_ALREADYENABLED": {
        "en": "Auto attack is already enabled.\nCannot be deactivated."
    },
    "MONSTER_OLD_MESSAGE": {
        "en": "_This monster is no longer a threat._"
    }
};