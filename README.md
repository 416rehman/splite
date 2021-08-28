# SPLITE - Discord Multi-Purpose Bot
[Add Splite to your Server](https://discord.com/api/oauth2/authorize?client_id=842244538248593439&permissions=4294438903&scope=bot%20applications.commands)
Based on [CalypsoBot](https://github.com/sabattle/CalypsoBot)

# Commands
**![:info~1:](https://cdn.discordapp.com/emojis/838615107181346887.gif?v=1) Info [22]**

`activity`, `admins`, `aliases`, `avatar`, `botinfo`, `channelinfo`, `emojis`, `help`, `inviteme`, `mods`, `permissions`, `ping`, `prefix`, `roleinfo`, `servercount`, `servericon`, `serverinfo`, `serverstaff`, `snipe`, `stats`, `uptime`, `whois`, `ratemyprofessor`, `vote`

**![:fun~1:](https://cdn.discordapp.com/emojis/838614336749568020.gif?v=1) Fun [84]**

`8ball`, `afk`, `approved`, `awooify`, `baguette`, `beautiful`, `bio`, `bird`, `biryani`, `blur`, `blurple`, `brazzers`, `burn`, `cat`, `catfact`, `challenger`, `changemymind`, `circle`, `clyde`, `coinflip`, `contrast`, `crush`, `dadjoke`, `deepfry`, `dictator`, `distort`, `dither`, `dog`, `dogfact`, `duck`, `dungeon`, `emboss`, `emojify`, `enlarge`, `fire`, `fox`, `frame`, `gay`, `geoguessr`, `glitch`, `greyple`, `greyscale`, `hate`, `instagram`, `insult`, `invert`, `jail`, `magik`, `meme`, `missionpassed`, `mock`, `moustache`, `nsfw`, `pickup`, `pixelize`, `posterize`, `ps4`, `redple`, `rejected`, `rip`, `roll`, `rps`, `scary`, `sepia`, `sharpen`, `shibe`, `ship`, `sniper`, `thanos`, `thouart`, `threats`, `tobecontinued`, `trap`, `triggered`, `trumptweet`, `unsharpen`, `urban`, `tatoo`, `wanted`, `wasted`, `whowouldwin`, `yesno`, `yomomma`, `youtube`

**![:points~1:](https://cdn.discordapp.com/emojis/838615754894475264.gif?v=1) Points [10]**

`bet`, `crown`, `explainpoints`, `gamble`, `givepoints`, `leaderboard`, `points`, `pointsper`, `position`, `totalpoints`, `odds`

**![:smashorpass:](https://cdn.discordapp.com/emojis/838588533497266217.gif?v=1) Smash or Pass [4]**

`matches`, `optout`, `resetsmashorpass`, `smashorpass`, `unmatch`

**![:misc~1:](https://cdn.discordapp.com/emojis/838614337928953886.gif?v=1) Misc [2]**

`feedback`, `reportbug`

**![:mods:](https://cdn.discordapp.com/emojis/838614337904050237.gif?v=1) Mod [21]**

`addemoji`, `addrole`, `ban`, `kick`, `members`, `mute`, `purge`, `purgebot`, `removeemoji`, `role`, `roles`, `setnickname`, `slowmode`, `softban`, `testfarewell`, `testwelcome`, `unban`, `unmute`, `warn`, `warnpurge`, `warns`

**![:admin~1:](https://cdn.discordapp.com/emojis/838614338515370064.gif?v=1) Admin [33]**

*Commands can be cleared by replacing "set" with "clear". i.e* `setmodlog` ➔ `clearmodlog`

`findstatus`, `say`, `setjoinvoting`, `setadminrole`, `setautokick`, `setautorole`, `setconfessionchannel`, `setcrownchannel`, `setcrownrole`, `setfarewellchannel`, `setfarewellmessage`, `setmemberlog`, `setmessagedeletelog`, `setmessageeditlog`, `setmodchannels`, `setmodlog`, `setmodrole`, `setmuterole`, `setnicknamelog`, `setprefix`, `setrolelog`, `setstarboardchannel`, `setsystemchannel`, `settings`, `setverificationchannel`, `setverificationmessage`, `setverificationrole`, `setviewconfessionsrole`, `setwelcomechannel`, `setwelcomemessage`, `toggleanonymous`, `togglecommand`, `toggletype`

**![:owner~1:](https://cdn.discordapp.com/emojis/832778968243503144.png?v=1) Owner [11]**

`blast`, `channels`, `eval`, `history`, `leaveguild`, `servers`, `setpoints`, `wipeallpoints`, `wipealltotalpoints`, `wipepoints`, `wipetotalpoints`

![:verified_developer:](https://cdn.discordapp.com/emojis/832779434641719306.png?v=1) **/Slash Commands**

`/anonymous` Post anonymous message. **Cost: 50 points**  
`/confess` Post a confession in confessions channel.  
`/report` Report a confession.  
`/view` View details of a confession.
# Setup

1. Clone the repo
2. Fill the config.js file - Incomplete config.js file might result in bot not functioning properly
3. Run `npm i` in the repo directory to install dependencies
4. Run `node app.js` command to run the bot

*If you wish to run the bot over pm2, use the command `pm2 ecosystem.config.js`*


## Modifying Functionality

### Commands
**Commands are stored /src/commands/{category}/ directory**

To add a new command, go into one of the category folders in the command folder, add a new .js file with your command name and implement your functionality in it.
Look at the existing command files to see how to create your own commands.

### Slash Commands
**Slash commands are stored in /src/slashCommands directory**

1. Create a slash command logic in a .js file inside /src/slashCommands directory. i.e `report.js` *(Take a look at an existing slashCommand file to see how they are made)*
2. Import the command file in /src/utils/utils.js. i.e. `const report = require("../slashCommands/report")`
3. Register the command in registerSlashCommand function inside utils.js.
4. Add the registered command to the callSlashCommand function in utils.js to run the logic when the slash command is executed by a user. i.e `if (command === 'report') report.report(interaction, client);`

# spliteBot
Database: SQLite
