const keys = {


    // Challenge

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
    },


    // User

    "USER_LEVELUP": {
        "en": "*$(username)* is now at level  `$(level)`",
    },
    "USER_LEVELDOWN": {
        "en": "*$(username)* has dropped to level  `$(level)`",
    },
    "USER_PRESTIGE_AVAILABLE": {
        "en": "*$(username)*, with a level of  `$(level)`  you can now prestige! type /prestige to preceed."
    },
    "USER_SILENCED_LEVELUP": {
        "en": "\n_From now on you will no longer be notified in case of a level up._",
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
    "STATS_ITEMS": {
        "en": "Item bonuses:  "
    },
    "STATS_ITEMS_PERM": {
        "en": "`+$(value)%`   "
    },
    "STATS_ITEMS_TEMP": {
        "en": "(`x$(value)`)"
    },
    "STATS_CHALLENGE_LUCK": {
        "en": "Challenges:  _W_ `$(valueW)` - _L_ `$(valueL)`"
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
    "SETTINGS_NOTIFY_ITEM_PICKUP": {
        "en": "Notify when an user pick up an item."
    },
    "SETTINGS_NOPERMISSION": {
        "en": "Sorry *$(username)*, only admins can change the bot settings."
    },
    "SETTINGS_PRIVATE_MESSAGE_SENT": {
        "en": "*$(username)* check your private chat with the bot to continue."
    },
    "SETTINGS_REPLY_ON": {
        "en": "On"
    },
    "SETTINGS_REPLY_OFF": {
        "en": "Off"
    },
    "SETTINGS_REPLY_FULL": {
        "en": "Full"
    },
    "SETTINGS_REPLY_COMPACT": {
        "en": "Compact"
    },


    // Items

    "ITEMS_LIST_TITLE": {
        "en": "💎 *$(username)*'s items list:"
    },
    "ITEMS_LIST_ITEM_PERM": {
        "en": "_$(name)_    `+$(value)%`   (x$(quantity))"
    },
    "ITEMS_LIST_ITEM_TEMP": {
        "en": "_$(name)_    `x$(value)`    ~$(timeout)"
    },
    "ITEMS_LIST_TOTAL": {
        "en": "TOTAL:  "
    },
    "ITEMS_LIST_NOITEMS": {
        "en": "*$(username)* you have no items or active bonuses yet.\nKeep texting, sooner or later you will find something!"
    },
    "ITEMS_PICKUP_FULL": {
        "en": "*$(username)* found an item:\n\n$(itemicon)  _$(itemname)_   `$(value)`\n$(itemdescription)\n\nType: `$(itemtype)`\nChance: `$(itemchance)%`"
    },
    "ITEMS_PICKUP_COMPACT": {
        "en": "*$(username)* found an item: _$(itemname)_   `$(value)`"
    },
    "ITEMS_TITLE_BAG": {
        "en": "Bag of money"
    },
    "ITEMS_DESCRIPTION_BAG": {
        "en": "Contains a bit of Exp. It's not a much, but better than nothing."
    },
    "ITEMS_TITLE_CHEST": {
        "en": "Chest"
    },
    "ITEMS_DESCRIPTION_CHEST": {
        "en": "Contains a nice amount of Exp."
    },
    "ITEMS_TITLE_TREASURE": {
        "en": "Treasure"
    },
    "ITEMS_DESCRIPTION_TREASURE": {
        "en": "Bingo! A very big treasure chest which contains a lot of Exp."
    },
    "ITEMS_TITLE_DAISY": {
        "en": "Scented Daisy"
    },
    "ITEMS_DESCRIPTION_DAISY": {
        "en": "It smells nice.. I guess.. You can put it in your pockets and gift it to a sheep if you'll ever find one later."
    },
    "ITEMS_TITLE_STONE": {
        "en": "Small Stone"
    },
    "ITEMS_DESCRIPTION_STONE": {
        "en": "A little stone. Can be found on the side of the road, just be carefull to not picking up the yellow ones.. trust me, leave them there."
    },
    "ITEMS_TITLE_BANANA": {
        "en": "Banana"
    },
    "ITEMS_DESCRIPTION_BANANA": {
        "en": "Just a banana. Can be used as scale unit if needed."
    },
    "ITEMS_TITLE_PINEAPPLE": {
        "en": "Pineapple"
    },
    "ITEMS_DESCRIPTION_PINEAPPLE": {
        "en": "A strange yellow and pointy fruit. It should have a particular effect but I don't remember what for."
    },
    "ITEMS_TITLE_APPLE": {
        "en": "Red Apple"
    },
    "ITEMS_DESCRIPTION_APPLE": {
        "en": "Ah yes, an apple. They grow on the trees, like money. Remember to clean it before eating it."
    },
    "ITEMS_TITLE_SAUCE": {
        "en": "Tasty Sauce"
    },
    "ITEMS_DESCRIPTION_SAUCE": {
        "en": "Can not miss on a nice plate of spaghetti. God bless whoever invented it!"
    },
    "ITEMS_TITLE_SAUSAGE": {
        "en": "Big Sausage"
    },
    "ITEMS_DESCRIPTION_SAUSAGE": {
        "en": "It's a sausage! ..and a BIG one! did you bring the BBQ?"
    },
    "ITEMS_TITLE_STICK": {
        "en": "Pointy Stick"
    },
    "ITEMS_DESCRIPTION_STICK": {
        "en": "A sharp and pointy stick, can be used to poke stuff to check if it's alive."
    },
    "ITEMS_TITLE_CRYSTAL": {
        "en": "Crystal"
    },
    "ITEMS_DESCRIPTION_CRYSTAL": {
        "en": "..what do you need to know? It's shiny and colorful, just pick it up and leave."
    },
    "ITEMS_TITLE_SUSEYE": {
        "en": "Suspicious  Eye"
    },
    "ITEMS_DESCRIPTION_SUSEYE": {
        "en": "A kinda SUS eyeball. Found in elettrical. Ah wait, it was Green who told me! I was in security doing tasks."
    },
    "ITEMS_TITLE_DRAGONEGG": {
        "en": "Dragon Egg"
    },
    "ITEMS_DESCRIPTION_DRAGONEGG": {
        "en": "Don't get too excited, it's well done but it's just a plastic model, maybe it belongs to a limited collection. You can use it as a card holder if needed."
    },
    "ITEMS_TITLE_RTX3090": {
        "en": "GeForce RTX™ 3090"
    },
    "ITEMS_DESCRIPTION_RTX3090": {
        "en": "They say it can run Minecraft at 60fps, time travel and solve the world's hunger.. but I'm not sure about the first one."
    },
    "ITEMS_TITLE_ELIXIR": {
        "en": "Elixir"
    },
    "ITEMS_DESCRIPTION_ELIXIR": {
        "en": "Ah yes, The Elixir! (also known as \"Elixir\") it's a drinkable fluid which you can drink and tastes like an Elixir!"
    },
    "ITEMS_TITLE_MEGAELIXIR": {
        "en": "Mega Elixir"
    },
    "ITEMS_DESCRIPTION_MEGAELIXIR": {
        "en": "An Elixir, but bigger! You have to drink it several times to be able to finish it all."
    },
    "ITEMS_TITLE_POISON": {
        "en": "Bad Poison"
    },
    "ITEMS_DESCRIPTION_POISON": {
        "en": "Not a nice looking drink. It is not recommended to drink it but who am I from preventing you from doing it.."
    },
    "ITEMS_TITLE_SHIT": {
        "en": "Smelly Shit"
    },
    "ITEMS_DESCRIPTION_SHIT": {
        "en": "Oh sh\\*t.. literally, You stepped on a big poop. Brown and smelly it will slow you down for a while.."
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
    "LABEL_ITEMTYPE_PERM": {
        "en": "Permanent"
    },
    "LABEL_ITEMTYPE_TEMP": {
        "en": "Temporary"
    },
    "LABEL_ITEMTYPE_INST": {
        "en": "Instant"
    },
    "LABEL_GROUPONLY_COMMAND": {
        "en": "This command can only be used in group chats."
    },
    "ERROR_MARKUP_NOTFOUND": {
        "en": "_Modal disabled._"
    }
};

module.exports = keys;