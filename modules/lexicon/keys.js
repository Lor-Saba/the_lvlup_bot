const keys = {


    // Update changelog

    "UPDATED_LABEL": {
        "en": "Hello spammers!\n*lvlup bot* has been updated to \"v$(version)\""
    },
    "UPDATED_BUTTON": {
        "en": "Check Changelog"
    },


    // Monster
     
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
    },


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
        "en": "*$(username)*, you can now prestige!\ntype /prestige to proceed."
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
    "STATS_EPM": {
        "en": "Exp per message:  `$(value)`"
    },
    "STATS_PRESTIGE_BONUS": {
        "en": "Prestige bonus:  `+$(value)%`"
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
        "en": "Items bonus:  "
    },
    "STATS_EFFECTS": {
        "en": "Effects bonus:  "
    },
    "STATS_EQUIPMENTS": {
        "en": "Equipments bonus:  "
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
    "ITEMS_CARD_FULL": {
        "en": "$(itemicon)  _$(itemname)_   `$(value)`\n$(itemdescription)\n\nType: `$(itemtype)`\nChance: `$(itemchance)`"
    },
    "ITEMS_CARD_COMPACT": {
        "en": "$(itemicon)  _$(itemname)_   `$(value)`"
    },
    "ITEMS_CRAFT_FULL": {
        "en": "*$(username)* put together $(recipe) and got:\n\n$(itemcard)"
    },
    "ITEMS_CRAFT_COMPACT": {
        "en": "*$(username)* put together $(recipe) and got:\n$(itemcard)"
    },
    "ITEMS_PICKUP_FULL": {
        "en": "*$(username)* found an item:\n\n$(itemcard)"
    },
    "ITEMS_PICKUP_COMPACT": {
        "en": "*$(username)* found an item:\n$(itemcard)"
    },
    "ITEMS_TITLE_BAG": {
        "en": "Bag of money"
    },
    "ITEMS_DESCRIPTION_BAG": {
        "en": "Contains a bit of Exp. It's not a much, but it's honest Exp."
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
        "en": "A little stone. Can be found on the side of the road, just be careful to not picking up the yellow ones.. trust me, leave them there."
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
        "en": "It's a sausage! ..and a BIG one! did you bring the BBQ sauce?"
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
    "ITEMS_TITLE_DUST": {
        "en": "Dust"
    },
    "ITEMS_DESCRIPTION_DUST": {
        "en": "You collected some dust from the ground and put it in your pocket ..what a strange person."
    },
    "ITEMS_TITLE_STRING": {
        "en": "Thin string"
    },
    "ITEMS_DESCRIPTION_STRING": {
        "en": "Thin and weak as a small hair, you can throw it in the wind to see it fly."
    },
    "ITEMS_TITLE_PAPER": {
        "en": "Piece of paper"
    },
    "ITEMS_DESCRIPTION_PAPER": {
        "en": "Useful to write down a list of the people you hate most with the respective tortures you have in mind ...or just the shopping list. (don't forget the milk)"
    },
    "ITEMS_TITLE_STRAWBERRY": {
        "en": "Strawberry"
    },
    "ITEMS_DESCRIPTION_STRAWBERRY": {
        "en": "While walking your way home you noticed an impressive bush full of strawberries in your neighbor's garden. You quickly grab one and run away." 
    },
    "ITEMS_TITLE_DUSTBALL": {
        "en": "Dust ball"
    },
    "ITEMS_DESCRIPTION_DUSTBALL": {
        "en": "After collecting a lot of dust, balls of compact dust have formed in your pockets. happy with the result you get back on the road proud of yourself."
    },
    "ITEMS_TITLE_BOOK": {
        "en": "Book"
    },
    "ITEMS_DESCRIPTION_BOOK": {
        "en": "After having fun drawing strange shapes on pieces of paper you decide to group them creating a nice colored book. noice."
    },
    "ITEMS_TITLE_BOUQUET": {
        "en": "Bouquet of flowers"
    },
    "ITEMS_DESCRIPTION_BOUQUET": {
        "en": "What's better than a beautiful flower? MANY beautiful flowers put together! a pleasure to smell too."
    },
    "ITEMS_TITLE_ROPE": {
        "en": "Rope"
    },
    "ITEMS_DESCRIPTION_ROPE": {
        "en": "Unity is strength! this is what you thought by putting together more and more strings to form a little rope."
    },
    "ITEMS_TITLE_CAIRN": {
        "en": "Cairn"
    },
    "ITEMS_DESCRIPTION_CAIRN": {
        "en": "You have learned the skill of putting multiple stones together to create a tower. Even if it is not very tall it still makes a good impression."
    },
    "ITEMS_TITLE_MACEDONIA": {
        "en": "Macedonia"
    },
    "ITEMS_DESCRIPTION_MACEDONIA": {
        "en": "You read this method for lazy people to eat more fruit together in a cooking magazine ..and you couldn't not try it yourself. Still looks edible, good job."
    },
    "ITEMS_TITLE_BBQ": {
        "en": "Barbecue"
    },
    "ITEMS_DESCRIPTION_BBQ": {
        "en": "Oh yes, delicious grilled meat. Everyone looks at you with their mouth watering."
    },
    "ITEMS_TITLE_DIAMOND": {
        "en": "Shiny diamond"
    },
    "ITEMS_DESCRIPTION_DIAMOND": {
        "en": "All those little crystal were pieces of a bigger and shiny diamond. You need 2 sun glasses to be able to look directly at it!"
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
    "LABEL_CRAFTED": {
        "en": "Crafted"
    },
    "ERROR_MARKUP_NOTFOUND": {
        "en": "_Modal disabled._"
    }
};

module.exports = keys;