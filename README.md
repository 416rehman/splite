<!--suppress ALL -->
<div align=center>

  <a href="https://github.com/ZerioDev/Music-bot">
    <img src="https://img.shields.io/badge/Music%20By-ZerioDev-green.svg" alt="Music by ZerioDev">
  </a>
  <a href="https://discord.gg/pxnu3eF6DG">
    <img src="https://discordapp.com/api/guilds/668625434157776896/widget.png?style=shield" alt="Join Splite's Support Server">
  </a>
  <a href="https://github.com/discordjs">
    <img src="https://img.shields.io/badge/discord.js-v14.6.0-gold.svg?logo=npm" alt="DiscordJS Version">
  </a>
  <a href="https://github.com/sabattle/CalypsoBot">
    <img src="https://img.shields.io/badge/Based%20on-Calypso-green.svg" alt="Based on Calypso Bot">
  </a>

</div>

# SPLITE - Multi-Purpose Discord v14 Bot

### Now with Slash Commands, Music, Moderation, and more!

#### New in Splite 5.0: Discord v14 support, YAML configuration, and many bug fixes

Splite is a free to use multipurpose Discord bot. It is designed to be a flexible and easy to use. ⭐ Consider starring
the repo on GitHub to help with development! ⭐
<hr/>

### Features

- Robust and flexible command handler supporting text-based and slash commands, restrict to permission level, VCs, NSFW
  channels, bot owners, bot managers, and more.
- Endpoint handler to listen to and respond to external web requests (Webhooks).
- Music Module to play music in voice channels from YouTube, SoundCloud, and Spotify.
- Logging features
- Sniping features to see the last deleted or edited message in a channel.
- Daily activity features and rewards (Points are earned through being active, most active user gets a role as reward
  until anothe winner is chosen the next day)
- Betting and Gambling features - Users can gamble and bet against other users to win or lose their daily points.
- Leaderboards to see the top active users, top moderators, and top points users.
- Fun commands such as ship, mock, whowouldwin, and many many more.

<hr/>

# Table of Contents

- [Setup](#setup)
    - [Prerequisites](#prerequisites)
    - [Configuration](#configuration)
    - [Starting the Bot](#starting-the-bot)
- [Cloud Configuration](#cloud-configuration)
- [Modifying Functionality](#modifying-functionality)
- [Command Handler](#command-handler)
    - [Command Handler Features](#command-handler-features)
    - [Creating Classic and Slash Commands - Code Sample](#creating-classic-and-slash-commands---code-sample)
    - [Hybrid (Text and Slash) Command - Shows the avatar of a user](#hybrid-text-and-slash-command---shows-the-avatar-of-a-user)
    - [Command Types](#command-types)
    - [Cooldowns](#cooldowns)
    - [Exclusive](#exclusive)
    - [Command Options](#command-options)
- [Endpoint Handler](#endpoint-handler)
    - [Endpoint Handler Features](#endpoint-handler-features)
    - [Sample Endpoint](#sample-endpoint)
    - [Endpoint Options](#endpoint-options)
    - [Scenario](#scenario)
        - [Problem](#problem)
        - [Solution - Webhooks via Endpoint Handler](#solution---webhooks-via-endpoint-handler)
            - [Prerequisites](#prerequisites)
            - [Create an Endpoint](#create-an-endpoint)
            - [Accessing the Endpoint](#accessing-the-endpoint)
            - [Finishing Off](#finishing-off)
- [TopGG Integration](#topgg-integration)
- [Commands](#commands)

<hr/>

### Setup

#### Prerequisites

1. Clone the repo and install the dependencies with `npm install`
2. Add the emojis from `emojis.zip` to your server and update the emoji IDs in `src/utils/emoji.json` to match your
   server's emoji IDs

#### Configuration

1. Create a copy of the `config.default.yaml` called `config.yaml`.
1. Fill the `config.yaml` file or alternatively, provide the corresponding environment variables (Click
   [here](#cloud-configuration) for more information).
2. **OPTIONAL**: If needed, environment variables can be used instead of a config file.

#### Starting the Bot

1. Run `npm run register` to register all slash commands
2. Run `node app.js` command to start the bot

*If you wish to run the bot over pm2, use the command `pm2 start`*
<hr/>

### Cloud Configuration

Splite's configuration can be set via environment variables. This is useful for cloud deployments such as Heroku, and
Repl.it.

Keep the following in mind when using environment variables:

- Prefix the configuration key with `SPLITE_`.
- Environment variables MUST be in all caps.
- List values are separated by a comma.
- Nested properties are separated by an underscore

**Example:**



| CONFIG.YAML                            | ENVIRONMENT VARIABLE                       |
|----------------------------------------|--------------------------------------------|
| token: "1234567890"                    | SPLITE_TOKEN=1234567890                    |
| owners: ["1234","1234"]                | SPLITE_OWNERS=1234,1234                    |
| apiKeys.topGG.api_mode.token: "q1w2e3" | SPLITE_APIKEYS_TOPGG_API_MODE_TOKEN=q1w2e3 |

*For convenience, the bot will output an environment variable equivalent of your config file upon startup.*

## Modifying Functionality

Commands are stored in `/src/commands/{category}/` directory<br>
Events are stored in `/src/events/` directory<br>
Endpoints are stored in `/src/endpoints/` directory<br>

### Command Handler

Splite has a powerful command handler that extends the calypso handler, allowing you to serve both classic commands and
slash commands from the same command class.<br>

#### Command Handler Features

1. Cooldowns
2. Exclusive / Instanced Commands (Only one instance of the command will be run per user, until the done() method is
   called)
3. Aliases
4. Categories/Types
5. VC Only Commands
6. NSFW Only Commands
7. User Blacklist (Bot owner can use `blacklist @user` to blacklist a user)
8. Restricted Commands - `Owner` type commands can only be used by the bot owner, `Manager` type commands can only
   be used by the bot managers and owners.

#### Creating Classic and Slash Commands - Code Sample

A command can be implemented using a classic text-based command, a slash command, or both.

In this section you will see how to create a command that can be used both as a classic command and a slash command.

##### Hybrid (Text and Slash) Command - Shows the avatar of a user

Classic text commands use the `run(message, args)` method of the Command class. Slash commands use
the `interact(interaction, args, author)` method of the Command class.

```javascript
// src/commands/fun/avatar.js

// Avatar Command
const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class AvatarCommand extends Command {
    // Command Info and Staging
    constructor(client) {
        super(client, {
            name: 'avatar',
            aliases: ['profilepic', 'pic', 'av'],
            usage: 'avatar [user mention/ID]',
            description: 'Displays a user\'s avatar (or your own, if no user is mentioned).',
            type: client.types.INFO,
            examples: ['avatar @split'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption((option) =>
                    option.setName('user').setDescription('The user to display the avatar of.')),
        });
    }

    // Text Based Command Listener
    async run(message, args) {
        const member = await this.getGuildMember(message.guild, args.join(' ')) || message.member;

        this.handle(member, message);
    }

    // Slash Command Listener
    async interact(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') || interaction.member;
        this.handle(user, interaction);
    }

    // Core Logic
    handle(targetUser, context) {
        const embed = new EmbedBuilder()
            .setDescription(`[Avatar URL](${this.getAvatarURL(targetUser)})`)
            .setTitle(`${this.getUserIdentifier(targetUser)}'s Avatar`)
            .setImage(this.getAvatarURL(targetUser));

        this.sendReply(context, {embeds: [embed]});
    }
};

```

#### Command Types

- **MISC:** This is the default type, and is used for commands that do not fit into any other category.
- **INFO:** Commands that do not change the state of the data and are used to display information.
- **FUN:** Commands that are used to entertain people.
- **POINTS:** Commands that are used to manage user points, gambling, economy, etc.
- **SMASHORPASS:** Commands that are used by the Smash or Pass system.
- **NSFW:** Commands that are NSFW (Not Safe For Work). **NOTE**:These command will only work in NSFW channels.
- **MOD:** Commands that can be used by server moderators to manage the server.
- **MUSIC:** Commands that are used by the music system.
- **ADMIN:** Commands that can be used by server admins to manage the server.
- **MANAGER:** Commands that can be used by bot managers. **NOTE** These commands can ONLY be used by bot managers (set
  in config.yaml).
- **OWNER:**  Commands that can be used by the bot owner. **NOTE** These commands can ONLY be used by the bot owner (set
  in config.yaml).

#### Restrictions

These are the restrictions that can be set for a command.

##### Restrict command to Voice Channels

To restrict a text command to only be used if a user is in a voice channel, add and set the `voiceChannelOnly` property
to `true`.

Example:

```js
voiceChannelOnly: true // Default is false
```

##### Restrict command to NSFW channels

To restrict a command to only be used in NSFW channels, add and set the `nsfwOnly` property to `true`.

Example:

```js
nsfwOnly: true // Default is false
```

##### Restrict command to a specific permission level

To restrict a command so only users with a specific permission level can use it, add the permissions to
the `userPermissions` property.

Example:

```js
userPermissions: ['KICK_MEMBERS', 'MANAGE_MESSAGES'] // Default is null
```

##### Restrict commands to Splite Bot Owners

To restrict a command to only be used by Splite Bot Owners, set the type to `OWNER`.

Example:

```js
type: 'OWNER' // Default is 'MISC'
```

Make sure to add the bot owners' ID(s) to the `owners` array in the config.yaml file.

```js
/// config.yaml
"owners"
:
["123456789012346578", "123456789012346579"], // Add the bot owners' ID(s) here
```

##### Restrict commands to Splite Bot Managers

To restrict a command to only be used by Splite Bot Managers, set the type in the Command file to `MANAGER`.

Example:

```js
type: 'MANAGER' // Default is 'MISC'
```

Make sure to add the bot managers' ID(s) to the `managers` array in the config.yaml file.

```js
/// config.yaml
"managers"
:
["123456789012346578", "123456789012346579"], // Add the bot managers' ID(s) here
```

#### Cooldowns

Cooldowns are handled by the commands own instance. Each command has a cooldowns collection and a default cooldown of 2
seconds. A cooldown can be specified by adding the `cooldown`option in the constructor of the command.

#### Exclusive

If the `exclusive` option is set to true in the constructor for the command, the calling user will not be able to call
that function again until the done() method is called. This is useful for commands whose functionality might not be
instant. For example, the **`kick`** command is not instant, when it is called, a prompt is displayed to the calling
user, and it awaits the user response. While the command is awaiting the user response, the user can call the kick
command again, and now there's more than one instances of the command waiting for the user's response. <br>We can avoid
this by setting the `exclusive` option to true, and when the command finishes listening for the user's response, we can
call the `done()` method. Now the user will only be able to call this method again only after that `done()` method is
called.,

In the below example, once the user calls the `prefix` command, they won't be able to call it again, until 30 seconds
after that command has been run.

##### Channel Exclusive

Similar to the `exclusive` option, but will act on an entire channel. This option allows for one running command at a
time in a channel, i.e. a trivia game command is set to be `channelExclusive: true`, now if a user starts a game of
trivia, another user won't be able to start another game of trivia in the same channel until the first game is finished
(done method is called).

```javascript
// src/commands/info/prefix.js

module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix',
            description: 'Shows the prefix of the bot',
            type: client.types.INFO,
            examples: ['prefix'],
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            cooldown: 10,
            // exclusive:true will make the command wait for the done() method 
            // to be called before allowing the user to call the command again
            exclusive: true
        });
    }

    // Text based command
    async run(interaction, args) {
        const prefix = interaction.client.db.settings.selectPrefix.pluck().get(interaction.guild_id);
        message.reply({
            embeds: [new EmbedBuilder().setTitle(`${interaction.client.config.name}'s Prefix`)
                .setDescription(`To change the prefix: \`${prefix}prefix <new prefix>\``)
                .addFields([{name: `Current Prefix`, value: `**\`${prefix}\`**`}])
                .setThumbnail(this.getAvatarURL(interaction.client.user))
                .setFooter({
                    text: interaction.author.tag,
                    iconURL: this.getAvatarURL(interaction.author)
                })
                .setTimestamp()]
        })

        setTimeout(() => {
            this.done(message.author.id)
            console.log(`The user can call the command now`);
        }, 30000)
    }
}
```

You should make sure your exclusive commands always call the done method.<br>
***If you forget to call the done() method, the bot will automatically call the done method 5 minutes after the command
was run to prevent unwanted lockouts from running the command***

#### Command Options

The following options are available for commands (default values are shown):

```javascript
name: "The name of the command - Must be unique",
    aliases
:
["The aliases of the command - Must be unique"],
    usage
:
"A usage example for the command",
    description
:
"The description of the command",
    type
:
"Should be the same as the folder name of the command. Valid choices: INFO, FUN, POINTS, SMASHORPASS, NSFW, MISC, MOD, MUSIC, ADMIN, OWNER, MANAGER",
    clientPermissions
:
["The permissions the client needs to run the command. Valid values in src/utils/permissions.json"],
    userPermissions
:
["The permissions the user needs to run the command. Valid values in src/utils/permissions.json"],
    examples
:
["An example of how to use the command"],
    cooldown
:
2 // The cooldown of the command in seconds
nsfwOnly: false // If the command can only be used in NSFW channels
voiceChannelOnly: false // If the command can only be used in voice channels
disabled: false // If true, the command will not be registered and will not be able to be used. config.yaml also provides a `disabledCommands` option to disable commands globally. config.yaml has priority over this option.
exclusive: false // If the command is exclusive, the user will not be able to call the command again until the done() method is called
slashCommand: new SlashCommandBuilder() // Builds a slash command using the name and description. Use the `interact` method to handle logic.
```

### Endpoint Handler

Splite also comes packed with a lightweight endpoint handler, powered by KoaJS.
This endpoint handler can help in creating a REST API for your bot, or by listening for external webhooks.
Endpoint handler only work if the webserver is running, you can enable the webserver by setting `webserver.enabled`
to `true` inside the `config.yaml` file.

#### Endpoint Handler Features

- Authorization: Set the `authorization` field to the authorization key you expect to receive from the webhook.
- Per IP Rate Limiting: Set the `rateLimit.rpm` field to the number of requests you want to allow per minute
  and `rateLimitCooldown` to the cooldown in milliseconds after hitting the rate limit.
- Restrict to IPs: Set the `allowedIPs` field to an array of IPs that are allowed to use the endpoint.
- Automatic routing: The endpoints URL will be generated automatically based on the folder's name and the file name. For
  more, [Accessing the Endpoint](#accessing-the-endpoint)

#### Sample Endpoint

```javascript
// src/endpoints/topgg/index.js
const Endpoint = require('../Endpoint');

module.exports = class SampleWebhook extends Endpoint {
    constructor(webserver) {
        super(webserver, {
            description: 'This is a sample webhook', // Description of the endpoint
        });
    }

    get(req, res) {
        return {
            status: 200,
            body: {
                message: 'This webhook is working!',
                hello: 'world'
            }
        };
    }

    post(req, res) {
        console.log(req.body);
        return {
            status: 200,
            body: {
                message: 'The body you sent is received!',
                someOtherField: 2 + 3,
                yetAnotherField: 'Hello World!'
            }
        };
    }
};

```

#### Endpoint Options

The following options are available for Endpoint handlers:

```javascript
description: 'This is a sample webhook', // Description of the endpoint
    rateLimit
:
{       // Rate limit info - Leave out to disable rate limiting
    rpm: 30,        // Requests per minute. Default: 30 - Set to 0 to disable rate limiting
        cooldown
:
    60000 // Cooldown (in milliseconds) for the IP after reaching the rate limit - Default: 60000 (1 minute)
}
,
allowedIPs: ['192.168.0.1', '192.168.0.2'], // Array of IPs that are allowed to use this endpoint - Leave out to disable check
    authorization
:
'ASDFAGASDGASDFASDFA', // Expects authorization header with this value to access this endpoint - Leave out to disable check
    disabled
:
false // Set to true to disable this endpoint - Leave out or set to false to disable check
```

#### Scenario

NOTE: This section goes over creating an endpoint handler for TopGG, a built-in endpoint handler for TopGG webhooks is
already provided, and to use that, skip over to [TopGG Integration](#topgg-integration)

TopGG is a popular bot directory where you can advertise your bot, and the more votes a bot has on TopGG the better
chance it has of being listed higher.
Splite's gambling system allows for dynamic odds, so we will setup a system, so if someone votes for our bot on TopGG,
we increase their odds by 10%.

TopGG comes with an endpoint you can query everytime you want to see if someone has voted for your bot. However this
endpoint has extremely heavy rate limiting.
To counteract this, we will query the endpoint once every 5 minutes, and if the user has voted, we will cache their vote
so we don't have to query the TopGG API anymore for this user for 6 hours.
However, if the bot starts checking for votes for thousands of users who have not voted, we will flood the TopGG API,
and the bot will start getting rate limited.

##### Problem

This would work, and is in fact a strategy we use in Splite to check for votes, but it is not very friendly when it
comes to User Experience.

Imagine this, a user checks their odds by running the `odds` command, the bot queries the TopGG API, user has not voted,
and the bot will wait 5 minutes before it queries the API for this user again.
Now the user goes, and votes for our bot, they run the `odds` command again, but now the bot is waiting on the 5 minutes
to be over, before it can check the TopGG API again to verify the user's vote.
After waiting for 5 minutes, the user checks their `odds` again, and now the 5 minutes wait is over, and the bot
verifies the user has voted by checking the TopGG API, and caches the user's vote, so
for the next 6 hours, the bot will not have to query the TopGG API for this user.

The user waits 5 minutes after voting, and that is not a good user experience. How can we fix this?

##### Solution - Webhooks via Endpoint Handler

Instead of using the TopGG API over and over again, TopGG also provides a webhook, so that everytime someone votes for
our bot, TopGG sends us the user's vote to an endpoint of our choice.

Let's create an endpoint handler that TopGG will send us the user's vote to.

###### Prerequisites

Before you can start creating and using endpoints, you must tell Splite you wish to do so by setting `webserver.enabled`
to `true` in the `config.yaml` file.

###### Create an endpoint

- Go to the `src/endpoints` directory, and create a new **folder** called `topgg`.
- Inside the `topgg` folder, create a new file called `vote.js`.
- Input the following code into the `vote.js` file:

```js
const Endpoint = require('../Endpoint');

module.exports = class TopGGVoteEndpoint extends Endpoint {
    constructor(webserver) {
        super(webserver, {
            description: 'Receives TopGG vote events.',
        });
    }

    post(req, res) {
        if (req.body?.user) {
            this.webserver.db.integrations.setTopGG.run(req.body.user, Date.now());
        }
    }
};
```

###### Accessing the endpoint

Splite's webserver will automatically do routing for you by using the folder and file names inside the `src/endpoints`
directory.

Here is an example of how to access endpoints LOCALLY based on their directory and file names:

```
| file                                | URL                                             |
|-------------------------------------|-------------------------------------------------|
| src/endpoints/topgg/vote.js         | topgg/vote                                      |
| src/endpoints/topgg/index.js        | topgg/                                          |
| src/endpoints/github/star.js        | github/star                                     |
| src/endpoints/github/index.js       | github/                                         |
| src/endpoints/topgg/votes/check.js  | INVALID - Only 1 layer of folders is supported. |
| src/endpoints/github/space check.js | github/space-check                              |
```

*The above URLs are for local development, to access the endpoints outside of your own network, you must use the
external IP address of your computer and set Port Forwarding, we won't be covering that here.*

###### Finishing Off

Now assuming, you have port forwarding set up and the webserver is accessible from the internet, you can provide the URL
of your endpoint to TopGG,
and your bot will be able to receive votes from TopGG, and update the database accordingly.

⛔**DO NOT** use the above example in your project since a complete implementation of TopGG webhooks is already provided
with all the functionality built-in. Check [TopGG Integration](#topgg-integration) for more information.
<hr/>

## TopGG Integration

Splite provides 2 modes for integrating with TopGG.

1. **`api_mode`** (Default) uses TopGG API, caches the votes in memory, does not interact with database, and comes with
   the above mentioned limitation (5 minutes wait after voting)
2. **`webhook_mode`** uses TopGG webhooks, does not use the cache and stores/retrieves the votes in database. Requires
   endpoint to be accessible by TopGG and is much more reliable.

To use TopGG webhooks, first make sure Splite's webserver is enabled (`webserver.enabled` set to `true`
in `config.yaml`) is accessible from the internet by sending a GET request to `<yourIP>:17170`, if you are greeted with
a 200 OK response, you can proceed to the next step.

Simply set `webserver.enabled` to `true` and `apiKeys.topGG.useMode` to `webhook_mode`in the `config.yaml` file.
Then set the Webhook URL in [TopGG](https://docs.top.gg/resources/webhooks/) to your endpoint URL. (
Default: `http://<yourIP>:17170/topgg/vote`)
Make sure to set the `apiKeys.topGG.webhook_mode.authorization` to the authorization-string provided by TopGG to make
sure only TopGG can access the webhook.

To modify the functionality of this endpoint, you can edit the `src/endpoints/topgg/vote.js` file.

## Commands

For the deployed list of commands, visit the [Commands Endpoint](https://splite.ahmadz.ai/commands).

**![:info~1:](https://cdn.discordapp.com/emojis/838615107181346887.gif?v=1) Info [30]**

`activity`, `admins`, `aliases`, `avatar`, `banner`, `botinfo`, `calculator`, `channelinfo`, `editsnipe`, `emojis`
, `help`, `inviteme`, `mods`, `permissions`, `ping`, `prefix`, `roleinfo`, `servercount`, `servericon`, `serverinfo`
, `serverstaff`, `snipe`, `stats`, `texthelp`, `uptime`, `vote`, `whois`, `report`, `clearafk`, `modactivity`

**![:fun~1:](https://cdn.discordapp.com/emojis/838614336749568020.gif?v=1) Fun [88]**

`8ball`, `afk`, `anonymous`, `approved`, `awooify`, `baguette`, `beautiful`, `bio`, `bird`, `biryani`, `blur`, `blurple`
, `brazzers`, `burn`, `cat`, `catfact`, `challenger`, `changemymind`, `circle`, `clyde`, `coinflip`, `confess`
, `contrast`, `crush`, `dadjoke`, `deepfry`, `dictator`, `distort`, `dog`, `dogfact`, `duck`, `dungeon`, `emboss`
, `emojify`, `enlarge`, `fire`, `fox`, `frame`, `gay`, `geoguessr`, `glitch`, `greyple`, `greyscale`, `hate`
, `instagram`, `insult`, `invert`, `jail`, `magik`, `meme`, `missionpassed`, `mock`, `moustache`, `nsfw`, `pickup`
, `pixelize`, `posterize`, `ps4`, `quickclick`, `redple`, `rejected`, `rip`, `roll`, `rps`, `scary`, `sepia`, `sharpen`
, `shibe`, `ship`, `snake`, `sniper`, `thanos`, `thouart`, `threats`, `tobecontinued`, `trap`, `triggered`, `trumptweet`
, `unsharpen`, `urban`, `tatoo`, `view`, `wanted`, `wasted`, `whowouldwin`, `yesno`, `yomomma`, `youtube`

**![:points~1:](https://cdn.discordapp.com/emojis/838615754894475264.gif?v=1) Points [12]**

`bet`, `crown`, `explainpoints`, `gamble`, `givepoints`, `leaderboard`, `odds`, `points`, `pointsper`, `position`
, `rigship`, `totalpoints`

**![:smashorpass:](https://cdn.discordapp.com/emojis/838588533497266217.gif?v=1) Smash or Pass [5]**

`matches`, `optout`, `resetsmashorpass`, `smashorpass`, `unmatch`

**![:misc~1:](https://cdn.discordapp.com/emojis/838614337928953886.gif?v=1) Misc [1]**

`feedback`

**![:mods:](https://cdn.discordapp.com/emojis/838614337904050237.gif?v=1) Mod [21]**

`addemoji`, `addrole`, `ban`, `clearwarns`, `kick`, `members`, `mute`, `purge`, `purgebot`, `removeemoji`, `role`
, `setnickname`, `slowmode`, `softban`, `testfarewell`, `testwelcome`, `unban`, `unmute`, `warn`, `warnpurge`, `warns`

**![:music:](https://cdn.discordapp.com/emojis/920916668484579328.gif?v=1) Music [16]**

`back`, `clear`, `filter`, `loop`, `nowplaying`, `pause`, `play`, `progress`, `queue`, `resume`, `save`, `search`
, `seek`, `shuffle`, `skip`, `stop`, `volume`

**![:admin~1:](https://cdn.discordapp.com/emojis/838614338515370064.gif?v=1) Admin [33]**

*Commands can be cleared by replacing "set" with "clear". i.e* `setmodlog` ➔ `clearmodlog`

`findstatus`, `say`, `setjoinvoting`, `setadminrole`, `setautokick`, `setautorole`, `setconfessionchannel`
, `setcrownchannel`, `setcrownrole`, `setfarewellchannel`, `setfarewellmessage`, `setmemberlog`, `setmessagedeletelog`
, `setmessageeditlog`, `setmodchannels`, `setmodlog`, `setmodrole`, `setmuterole`, `setnicknamelog`, `setprefix`
, `setrolelog`, `setstarboardchannel`, `setsystemchannel`, `settings`, `setverificationchannel`
, `setverificationmessage`, `setverificationrole`, `setviewconfessionsrole`, `setwelcomechannel`, `setwelcomemessage`
, `toggleanonymous`, `togglecommand`, `toggletype`

**![:manager~1:](https://cdn.discordapp.com/emojis/969740401927934073.png?v=1) Manager [7]**

`blacklist`, `clearodds`, `servers`, `setodds`, `setpoints`, `whitelist`, `wipepoints`

**![:owner~1:](https://cdn.discordapp.com/emojis/832778968243503144.png?v=1) Owner [7]**

`blast`, `eval`, `leaveguild`, `wipeallpoints`, `wipealltotalpoints`, `wipepoints`, `wipetotalpoints`

![:verified_developer:](https://cdn.discordapp.com/emojis/832779434641719306.png?v=1) **/Slash Commands**

`/anonymous` Post anonymous message. **Cost: 50 points**  
`/confess` Post a confession in confessions channel.  
`/report` Report a confession.  
`/view` View details of a confession.
