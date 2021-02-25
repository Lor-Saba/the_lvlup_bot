module.exports = {

    "CHALLENGE_START": {
        "en": "*$(username)* choose your move to continue."
    },
    "CHALLENGE_END": {
        "en": "*$(username)* asks to be challenged!\nAnyone brave enough to accept?"
    },
    "CHALLENGE_END_DIRECT": {
        "en": "*$(username)* challenged *$(challengedUsername)*!\nwill he/she be brave enough to accept?"
    },
    "CHALLENGE_OPTION_R": {
        "en": "✊"
    },
    "CHALLENGE_OPTION_P": {
        "en": "✋"
    },
    "CHALLENGE_OPTION_S": {
        "en": "✌️"
    },
    "CHALLENGE_OPTION_RAND": {
        "en": "🤞 Pick for me 🤞"
    },
    "CHALLENGE_BUTTON": {
        "en": "Challenge!"
    },
    "CHALLENGE_ACCEPTED": {
        "en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n\n*$(usernameA)* wins if an even number comes out,\notherwise it's a *$(usernameB)*'s win."
    },
    "CHALLENGE_AVAILABLE": {
        "en": "Challenge avaliable! Type /challengeme to drop the glove."
    },
    "CHALLENGE_RESULT": {
        "en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n\n*$(usernameA)*: $(pickA)\n*$(usernameB)*: $(pickB)\n\n*$(usernameW)*:  `+$(expGainW) Exp`\n*$(usernameL)*:  `$(expGainL) Exp`."
    },
    "CHALLENGE_RESULT_DRAW": {
        "en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n\n*$(usernameA)*: $(pickA)\n*$(usernameB)*: $(pickB)\n\nIt's a draw.\nYou can still ask for another challenge."
    },
    "CHALLENGE_RESULT_DRAW_COMPACT": {
        "en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n_It's a draw._    $(pickA) - $(pickB)\nYou can still ask for another challenge."
    },
    "CHALLENGE_TIMEOUT": {
        "en": "*$(username)*, you can ask for a new challenge in _$(timeout)_."
    },
    "CHALLENGE_ERROR_LEVEL": {
        "en": "*$(username)*, you must be at least level `3` to be able to create and accept challenges."
    },
    "CHALLENGE_SELF_CHALLENGE": {
        "en": "Ehm.. you can't challenge yourself *$(username)*.\n_The action was blocked but still counted as a requested challenge_"
    },
    "CHALLENGE_CANNOT_ACCEPTED": {
        "en": "Sorry, you can't accept this challenge."
    },
    "CHALLENGE_DROP_TITLE": {
        "en": "*$(username)* dropped"
    },
    "CHALLENGE_DROP_ITEM": {
        "en": "◻️ _$(itemname)_   `$(value)`"
    },
    "CHALLENGE_DROP_FOOTER_W": {
        "en": "for achieving `$(value)` wins."
    },
    "CHALLENGE_DROP_FOOTER_WT": {
        "en": "for achieving `$(value)` wins and `$(total)` total challenges."
    },
    "CHALLENGE_DROP_FOOTER_L": {
        "en": "for achieving `$(value)` loses."
    },
    "CHALLENGE_DROP_FOOTER_LT": {
        "en": "for achieving `$(value)` loses and `$(total)` total challenges."
    },
    "CHALLENGE_DROP_FOOTER_T": {
        "en": "for achieving `$(total)` total challenges."
    },
    "CHALLENGE_SEASON_END": {
        "en": "🏆 Congratulations *$(username1)*!\nFor reaching 100 challenge points you have won the current season!\n\nTop 3 rewards:\n🥇*$(username1)*    `$(exp1) Exp`\n🥈*$(username2)*    `$(exp2) Exp`\n🥉*$(username3)*    `$(exp3) Exp`"
    }
};