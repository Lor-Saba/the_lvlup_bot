module.exports = {

    "CHALLENGE_START": {
        "en": "*$(username)* asks to be challenged!\nAnyone brave enough to accept?"
    },
    "CHALLENGE_BUTTON": {
        "en": "Challenge!"
    },
    "CHALLENGE_ACCEPTED": {
        //"en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n\nA dice will be rolled.\nIf an even number comes out *$(usernameA)* wins,\notherwise it's a *$(usernameB)*'s win"
        "en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n\n*$(usernameA)* wins if an even number comes out,\notherwise it's a *$(usernameB)*'s win."
    },
    "CHALLENGE_AVAILABLE": {
        "en": "Challenge avaliable! Type /challengeme to drop the glove."
    },
    "CHALLENGE_RESULT": {
        //"en": "It's a $(result)!\nCongratulations *$(usernameW)*, you won! `+$(expGainW) Exp`\n*$(usernameL)* lost `$(expGainL) Exp`."
        "en": "It's a `$(result)`\nCongratulations *$(usernameW)*, you won!\n\n*$(usernameW)*:  `+$(expGainW) Exp`\n*$(usernameL)*:  `$(expGainL) Exp`."
    },
    "CHALLENGE_TIMEOUT": {
        "en": "*$(username)*, you can ask for a new challenge in _$(timeout)_."
    },
    "CHALLENGE_ERROR_LEVEL": {
        "en": "*$(username)*, you must be at least level `3` to be able to create and accept challenges."
    }
};