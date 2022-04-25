<div align=center>

  <a href="https://github.com/ZerioDev/Music-bot">
    <img src="https://img.shields.io/badge/Music%20By-ZerioDev-green.svg" alt="Music by ZerioDev">
  </a>
  <a href="https://discord.gg/pxnu3eF6DG">
    <img src="https://discordapp.com/api/guilds/668625434157776896/widget.png?style=shield" alt="Join Splite's Support Server">
  </a>
  <a href="https://github.com/discordjs">
    <img src="https://img.shields.io/badge/discord.js-v13.2.0-gold.svg?logo=npm" alt="DiscordJS Version">
  </a>
  <a href="https://github.com/sabattle/CalypsoBot">
    <img src="https://img.shields.io/badge/Based%20on-Calypso-green.svg" alt="Based on Calypso Bot">
  </a>

</div>

# SPLITE - Multi-Purpose Discord v13 Bot
### Now supports Music, Moderation, and more!

Splite is a free to use multipurpose Discord bot. It is designed to be a flexible and easy to use.

⭐ Consider starring the repo on GitHub to help with development! ⭐


# Setup

1. Clone the repo
2. Add the emojis from emojis.zip to your server
3. Update src/utils/emoji.json to use emojis from your server
4. Fill the config.js file - Incomplete config.js file might result in bot not functioning properly
5. Run `npm i` in the repo directory to install dependencies
6. Run `node app.js` command to run the bot

*If you wish to run the bot over pm2, use the command `pm2 start`*


## Modifying Functionality

### Command Handler
Commands are stored `/src/commands/commands/{category}/` directory<br>
Slash Commands are stored `/src/commands/slashCommands/{category}/` directory<br><br>
Splite has a powerful command handler that extends the calypso handler, allowing you to serve both classic commands and slash commands from the same command class.<br>
Features include
1. Cooldowns
2. Exclusive / Instanced Commands (Only one instance of the command will be run per user, until the done() method is called)
3. Aliases
4. Categories/Types


### Creating Classic vs Slash Commands - Code Sample
#### Classic Command - Shows the prefix of the bot
```javascript
module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix',
            description: 'Shows the prefix of the bot',
            type: client.types.INFO,
            examples: ['prefix'],
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            cooldown: 5
        });
    }

    async run(message, args) {
        console.log(`The first argument is ${args[0]}`)
        const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
        message.channel.send({
            embeds: [new MessageEmbed().setTitle(`${message.client.config.name}'s Prefix`)
                .setDescription(`To change the prefix: \`${prefix}prefix <new prefix>\``)
                .addField(`Current Prefix`, `**\`${prefix}\`**`)
                .setThumbnail(message.client.user.displayAvatarURL())
                .setFooter({
          text: message.member.displayName,
          iconURL: message.author.displayAvatarURL({dynamic: true})
        })
                .setTimestamp()]
        })
    }
} 
```

#### Slash Command - Shows the prefix of the bot
```javascript
module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix',
            description: 'Shows the prefix of the bot',
            type: client.types.INFO,
            examples: ['prefix'],
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            cooldown: 5,
            slashCommand: new SlashCommandBuilder()
                .addStringOption(options => options
                    .setName('argument name')
                    .setDescription(`argument description`))
        });
    }

    async run(interaction, args) {
        console.log(`The first argument is ${args[0]}`)
        const prefix = interaction.client.db.settings.selectPrefix.pluck().get(interaction.guild_id);
        interaction.reply({
            embeds: [new MessageEmbed().setTitle(`${interaction.client.config.name}'s Prefix`)
                .setDescription(`To change the prefix: \`${prefix}prefix <new prefix>\``)
                .addField(`Current Prefix`, `**\`${prefix}\`**`)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({
                    text: interaction.author.tag,
                    iconURL: interaction.author.displayAvatarURL({dynamic: true})
                })
                .setTimestamp()],
            ephemeral: true
        })
    }
}
```


### Cooldowns
Cooldowns are handled by the commands own instance. Each command has a cooldowns collection and a default cooldown of 2 seconds. A cooldown can be specified by adding the `cooldown`option in the constructor of the command.

### Exclusive
If the `exclusive` option is set to true in the constructor for the command, the calling user will not be able to call that function again until the done() method is called.
This is useful for commands whose functionality might not be instant. For example, the **`kick`** command is not instant, when it is called, a prompt is displayed to the calling user, and it awaits the user response. While the command is awaiting the user response, the user can call the kick command again, and now there's more than one instances of the command waiting for the user's response. <br>We can avoid this by setting the `exclusive` option to true, and when the command finishes listening for the user's response, we can call the `done()` method. Now the user will only be able to call this method again only after that `done()` method is called.,

In the below example, once the user calls the `prefix` command, they won't be able to call it again, until 30 seconds after that command has been run.
```javascript
module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix',
            description: 'Shows the prefix of the bot',
            type: client.types.INFO,
            examples: ['prefix'],
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            cooldown: 10,
            exclusive: true
        });
    }
    async run(interaction, args) {
        const prefix = interaction.client.db.settings.selectPrefix.pluck().get(interaction.guild_id);
        message.reply({
            embeds: [new MessageEmbed().setTitle(`${interaction.client.config.name}'s Prefix`)
                .setDescription(`To change the prefix: \`${prefix}prefix <new prefix>\``)
                .addField(`Current Prefix`, `**\`${prefix}\`**`)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({
                    text: interaction.author.tag,
                    iconURL: interaction.author.displayAvatarURL({dynamic: true})
                })
                .setTimestamp()]
        })

        setTimeout(()=>{
            this.done(message.author.id)
            console.log(`The user can call the command now`);
        }, 30000)
    }
}
```

You should make sure your exclusive commands always call the done method.<br>
***If you forget to call the done() method, the bot will automatically call the done method 5 minutes after the command was run to prevent unwanted lockouts from running the command***


# Commands
**![:info~1:](https://cdn.discordapp.com/emojis/838615107181346887.gif?v=1) Info [27]**

`activity`, `admins`, `aliases`, `avatar`, `botinfo`, `channelinfo`, `emojis`, `help`, `inviteme`, `mods`, `permissions`, `ping`, `prefix`, `roleinfo`, `servercount`, `servericon`, `serverinfo`, `serverstaff`, `snipe`, `editsnipe`, `stats`, `uptime`, `whois`, `ratemyprofessor`, `vote`, `modactivity`

**![:fun~1:](https://cdn.discordapp.com/emojis/838614336749568020.gif?v=1) Fun [84]**

`8ball`, `afk`, `approved`, `awooify`, `baguette`, `beautiful`, `bio`, `bird`, `biryani`, `blur`, `blurple`, `brazzers`, `burn`, `cat`, `catfact`, `challenger`, `changemymind`, `circle`, `clyde`, `coinflip`, `contrast`, `crush`, `dadjoke`, `deepfry`, `dictator`, `distort`, `dither`, `dog`, `dogfact`, `duck`, `dungeon`, `emboss`, `emojify`, `enlarge`, `fire`, `fox`, `frame`, `gay`, `geoguessr`, `glitch`, `greyple`, `greyscale`, `hate`, `instagram`, `insult`, `invert`, `jail`, `magik`, `meme`, `missionpassed`, `mock`, `moustache`, `nsfw`, `pickup`, `pixelize`, `posterize`, `ps4`, `redple`, `rejected`, `rip`, `roll`, `rps`, `scary`, `sepia`, `sharpen`, `shibe`, `ship`, `sniper`, `thanos`, `thouart`, `threats`, `tobecontinued`, `trap`, `triggered`, `trumptweet`, `unsharpen`, `urban`, `tatoo`, `wanted`, `wasted`, `whowouldwin`, `yesno`, `yomomma`, `youtube`

**![:points~1:](https://cdn.discordapp.com/emojis/838615754894475264.gif?v=1) Points [12]**

`bet`, `crown`, `explainpoints`, `gamble`, `givepoints`, `leaderboard`, `points`, `pointsper`, `position`, `rigship`, `totalpoints`, `odds`

**![:smashorpass:](https://cdn.discordapp.com/emojis/838588533497266217.gif?v=1) Smash or Pass [4]**

`matches`, `optout`, `resetsmashorpass`, `smashorpass`, `unmatch`

**![:misc~1:](https://cdn.discordapp.com/emojis/838614337928953886.gif?v=1) Misc [2]**

`feedback`, `reportbug`

**![:mods:](https://cdn.discordapp.com/emojis/838614337904050237.gif?v=1) Mod [20]**

`addemoji`, `addrole`, `ban`, `kick`, `members`, `mute`, `purge`, `purgebot`, `removeemoji`, `role`, `setnickname`, `slowmode`, `softban`, `testfarewell`, `testwelcome`, `unban`, `unmute`, `warn`, `warnpurge`, `warns`

**![:music:](https://cdn.discordapp.com/emojis/920916668484579328.gif?v=1) Music [16]**

`back`, `filter`, `loop`, `nowplaying`, `pause`, `play`, `progress`, `queue`, `resume`, `save`, `search`, `seek`, `shuffle`, `skip`, `stop`, `volume`

**![:admin~1:](https://cdn.discordapp.com/emojis/838614338515370064.gif?v=1) Admin [33]**

*Commands can be cleared by replacing "set" with "clear". i.e* `setmodlog` ➔ `clearmodlog`

`findstatus`, `say`, `setjoinvoting`, `setadminrole`, `setautokick`, `setautorole`, `setconfessionchannel`, `setcrownchannel`, `setcrownrole`, `setfarewellchannel`, `setfarewellmessage`, `setmemberlog`, `setmessagedeletelog`, `setmessageeditlog`, `setmodchannels`, `setmodlog`, `setmodrole`, `setmuterole`, `setnicknamelog`, `setprefix`, `setrolelog`, `setstarboardchannel`, `setsystemchannel`, `settings`, `setverificationchannel`, `setverificationmessage`, `setverificationrole`, `setviewconfessionsrole`, `setwelcomechannel`, `setwelcomemessage`, `toggleanonymous`, `togglecommand`, `toggletype`

**![:owner~1:](https://cdn.discordapp.com/emojis/832778968243503144.png?v=1) Owner [12]**

`blacklist`, `blast`, `eval`, `leaveguild`, `servers`, `setodds`, `setpoints`, `whitelist`, `wipeallpoints`, `wipealltotalpoints`, `wipepoints`, `wipetotalpoints`

![:verified_developer:](https://cdn.discordapp.com/emojis/832779434641719306.png?v=1) **/Slash Commands**

`/anonymous` Post anonymous message. **Cost: 50 points**  
`/confess` Post a confession in confessions channel.  
`/report` Report a confession.  
`/view` View details of a confession.
