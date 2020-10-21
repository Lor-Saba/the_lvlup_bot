const keys = {


    // Challenge

    "CHALLENGE_AVAILABLE": {
        "en": "Challenge avaliable! Type /challengeme to drop the glove."
    },
    "CHALLENGE_WON_BY": {
        "en": "$(username) won!"
    },
    "CHALLENGE_TIMEOUT": {
        "en": "Next challenge in $(timeout)."
    },
    "CHALLENGE_RULES": {
        "en": "..."
    },


    // User

    "USER_LEVELUP": {
        "en": "$(username) is now at level $(level)!",
        //"it": "$(username) è salito al livello $(level)!"
    },
    "USER_PRESTIGE_AVAILABLE": {
        "en": "$(username), with a level of $(level) you can now prestige! type /prestige to preceed."
    },
    "USER_PRESTIGE_SUCCESS": {
        "en": "$(username) prestiged! \nCurrent prestige level: $(prestige)"
    },
    "USER_PRESTIGE_FAIL": {
        "en": "You can't prestige yet $(username)."
    },


    // Stats

    "STATS_INFO": {
        "en": "📈 Stats of *$(username)*."
    },
    "STATS_NOUSER": {
        "en": "$(username), seems like you don't have stats yet.\nStart chatting to gain exp! :)"
    },
    "STATS_LEVEL_PROGRESS": {
        "en": "To next Level: $(percentage)%"
    },
    "STATS_PRESTIGE_PROGRESS": {
        "en": "To next Prestige: $(percentage)%"
    },
    "STATS_FOR_NEXT_LEVEL": {
        "en": "_($(missingExp) Exp)_"
    },
    "STATS_LEADERBOARD_POSITION": {
        "en": "Position in /leaderboard"
    },
    "STATS_PENALITY_LEVEL": {
        "en": "Penality level: "
    },


    // Penality
    
    "PENALITY_LEVEL_2": {
        "en": "Spam detected *$(username)*.\nYour exp gain is reduced by 75% for 40s."
    },
    "PENALITY_LEVEL_4": {
        "en": "Too much spam *$(username)*.\nYour exp gain is blocked for 5m."
    },


    // Setting

    "SETTING_TITLE": {
        "en": "⚙️ Settings modal for:\n*$(chatTitle)*\n\n"
    },
    "SETTING_START": {
        "en": "Choose which option to change:"
    },
    "SETTING_BACK": {
        "en": "<< Back"
    },
    "SETTING_NOTIFY_PENALITY": {
        "en": "Notify penality changes to users."
    },
    "SETTING_NOTIFY_LEVELUP": {
        "en": "Notify on level up."
    },
    "SETTING_NOTIFY_PRESTIGE_AVAILABLE": {
        "en": "Notify when prestige is available."
    },
    "SETTING_NOPERMISSION": {
        "en": "Sorry *$(username)*, only admins can change the bot settings."
    },
    "SETTING_PRIVATE_MESSAGE_SENT": {
        "en": "*$(username)* check your private chat with the bot to continue."
    },
    "SETTINGS_REPLY_YES": {
        "en": "Yes"
    },
    "SETTINGS_REPLY_NO": {
        "en": "No"
    },
    "SETTING_ERROR_CHATNOTFOUND": {
        "en": "Modal disabled because something went wrong or too old."
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
    }
};

module.exports = keys;