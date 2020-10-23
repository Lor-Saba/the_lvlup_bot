const keys = {


    // Challenge

    "CHALLENGE_START": {
        "en": "*$(username)* asks to be challenged!\nAnyone brave enough to accept?"
    },
    "CHALLENGE_BUTTON": {
        "en": "Challenge!"
    },
    "CHALLENGE_ACCEPTED": {
        "en": "*$(usernameB)* accepted *$(usernameA)*'s challenge!\n\nA dice will be rolled.\nIf an even number comes out *$(usernameA)* wins,\notherwise it's a *$(usernameB)*'s win"
    },
    "CHALLENGE_AVAILABLE": {
        "en": "Challenge avaliable! Type /challengeme to drop the glove."
    },
    "CHALLENGE_RESULT": {
        "en": "It's a $(result)!\nCongratulations *$(usernameW)*, you won! `+$(expGainW) Exp`\n*$(usernameL)* lost `$(expGainL) Exp`."
    },
    "CHALLENGE_TIMEOUT": {
        "en": "*$(username)*, you can ask for a new challenge in _$(timeout)_ seconds."
    },


    // User

    "USER_LEVELUP": {
        "en": "*$(username)* is now at level  `$(level)`",
        //"it": "$(username) è salito al livello $(level)!"
    },
    "USER_LEVELDOWN": {
        "en": "*$(username)* leveled down  `$(level)`",
    },
    "USER_PRESTIGE_AVAILABLE": {
        "en": "*$(username)*, with a level of  `$(level)`  you can now prestige! type /prestige to preceed."
    },
    "USER_PRESTIGE_SUCCESS": {
        "en": "*$(username)* prestiged! \nCurrent prestige level:  `$(prestige)`"
    },
    "USER_PRESTIGE_FAIL": {
        "en": "You can't prestige yet *$(username)*."
    },


    // Stats

    "STATS_INFO": {
        "en": "📈 Stats of *$(username)*."
    },
    "STATS_NOUSER": {
        "en": "*$(username)*, seems like you don't have stats yet.\nStart chatting to gain exp! :)"
    },
    "STATS_LEVEL_PROGRESS": {
        "en": "To next Level:  `$(percentage)%`"
    },
    "STATS_PRESTIGE_PROGRESS": {
        "en": "To next Prestige:  `$(percentage)%`"
    },
    "STATS_LEADERBOARD_POSITION": {
        "en": "Position in /leaderboard"
    },
    "STATS_PENALITY_LEVEL": {
        "en": "Penality level: "
    },
    "STATS_LABEL_EXP": {
        "en": "Exp:  `$(value)`"
    },
    "STATS_LABEL_LEVEL": {
        "en": "Level:  `$(value)`"
    },
    "STATS_LABEL_PRESTIGE": {
        "en": "Prestige:  `$(value)`"
    },


    // Penality
    
    "PENALITY_LEVEL_2": {
        "en": "Spam detected *$(username)*.\nYour exp gain is reduced by 75% for 40s."
    },
    "PENALITY_LEVEL_4": {
        "en": "Too much spam *$(username)*.\nYour exp gain is blocked for 5m."
    },


    // Setting

    "SETTINGS_TITLE": {
        "en": "⚙️ Settings modal for:\n*$(chatTitle)*\n\n"
    },
    "SETTINGS_START": {
        "en": "Choose which option to change:"
    },
    "SETTINGS_BACK": {
        "en": "« Back"
    },
    "SETTINGS_NOTIFY_PENALITY": {
        "en": "Notify user's penality changes."
    },
    "SETTINGS_NOTIFY_LEVELUP": {
        "en": "Notify when an user level up."
    },
    "SETTINGS_NOTIFY_PRESTIGE_AVAILABLE": {
        "en": "Notify when an user can prestige."
    },
    "SETTINGS_NOPERMISSION": {
        "en": "Sorry *$(username)*, only admins can change the bot settings."
    },
    "SETTINGS_PRIVATE_MESSAGE_SENT": {
        "en": "*$(username)* check your private chat with the bot to continue."
    },
    "SETTINGS_REPLY_YES": {
        "en": "Yes"
    },
    "SETTINGS_REPLY_NO": {
        "en": "No"
    },

    
    // Others
    
    "LABEL_EXP": {
        "en": "Exp"
    },
    "LABEL_LEVEL": {
        "en": "Level"
    },
    "LABEL_PRESTIGE": {
        "en": "Prestige"
    },
    "LABEL_GROUPONLY_COMMAND": {
        "en": "This command can only be used in group chats."
    },
    "ERROR_MARKUP_NOTFOUND": {
        "en": "Modal disabled.\n_(Auto delete in 5 seconds..)_"
    }
};

module.exports = keys;