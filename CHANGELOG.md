
# 1.1.6
    - change dungeon exploration fail from 20% to 12.5%
    - changes for monster event
        - the damage dealt to monsters will be the user's max level reached of all prestiges
        - increased exp reward based on monster level
    - fix operations solution in riddles
    - add new items for dungeon and exp

# 1.1.5
    - fix monster self descruct timeout not being cleared after first attack
    - change dungeon exploration fail from 25% to 20%
    - add new module for "riddles events"
        - twice a day there is a 15% chance of  a riddle being displayed
        - the first to answer correctly will recive some exp as reward

# 1.1.4
    - change monster attack cooldown from 60m to 30m
    - change monster defeat exp gain from 5epm to 7epm
    - add RANDOM pick to challenges 
        - you'll get 1/3 of the exp if you win a challenge using the random option (same if you lose)
    - fix of stats lost in case of group migration to supergroup
    - add monster / dungeon / riddles to chat settings
    - settings are now displayed inside the group chat
    - add mechanic to gradually increase the drop chanche each message by 0.00015% 
    - change dungeon spawn from 21:00 to 13:00
    - add seasons to challenges
        - the first to reach 100 points wins the season
        - completing the season resets che current challenges stats (W/L)
    
# 1.1.3

    - change dungeon time to 20:00
    - rebalance of dungeon's items
    - fixes on markup module (manager of messages with actions)
    - new output for /challengeme draw case (more compact)
    - add "chat vitality check" to delete cache data of inactive chats (30 days inactivity)

# 1.1.2 

    - changelog moved to root as single file
    - new output for /leaderboard (challenge w/l) to convert w&l to a point system
    - add debug log system
    - fix calc for instant items drop from dungeons
    - new challenge system! replaced the random dice with Rock/Paper/Scissors
    - reset of challenge stats and related items
    - add new challenge lexicons
    - change dungeon spawn from 10:00 to 20:00
    - change monster spawn from 10:00 to 09:00

# 1.1.1

    - increase gif & stickers exp per message gain from 0.2 to 0.4
    - fix leaderboard sort functions
    - fix challenges can't get dice value
    - increase stickers and gif message exp worth from 0.2 to 0.4

# 1.1.0

    - add update message
    - add some calendar events (like xmas, etc..)
    - add Monster event (spawn every sunday)
        - time limit of 1h to start the fight
        - time limit of 8h to defeat it
        - cooldown of 30min each attack
        - attack damage is based on the user level
    - add Dungeon event (spawn every Tuesday and Thursday)
        - can be explored only once per user
        - time limit of 1h 
        - gives damage related drops and exp
    - challenge changes
        - global reset of stats
        - on win gain changed from 7 to 3 messages worth Exp
        - on lose gain changed from -5 to -3 messages worth Exp
        - "direct challenges", it's possible to directly challenge an user by sending the /challengeme command as reply to a comment
    - items changes
        - add items drop that affect challenge's win, lose and cooldown
        - add items drop that affect monster events
        - remove instant items from messages drop
    - add new command /chatstats 
    - new output for /challengeme command to decrease spam (more compact)
    - new output for /items command to handle the new items types
    - new output for /leaderboard command to print different types of lists (exp / absolute position / challenge ratio / challenged users)
    - drop pickup / penality / messages / commands cooldowns are now chat related
    - gif and stickers now gives 0.2 messages worth Exp (instead of 0) but cannot drop
    - add an incremental scale of 100 messages each prestige on top of the required 1500 messages to prestige
    - increase messages drop chance from 1.2% to 1.5%
    - a lot of code rework & bugfixes
    