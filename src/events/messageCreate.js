const {EmbedBuilder, ChannelType} = require('discord.js');
const {dnd} = require('../utils/emojis.json');
const moment = require('moment');
const {oneLine} = require('common-tags');
const {nsfw, fail} = require('../utils/emojis.json');

module.exports = async (client, message) => {
    if (message.channel.type === ChannelType.DM || !message.channel.viewable || message.author.bot) return;

    //Update MessageCount
    client.db.activities.updateMessages.run({
        userId: message.author.id, guildId: message.guild.id,
    });

    client.removeAFK(message.member, message.guild, message.channel);

    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
        const afkStatus = client.db.users.selectAfk.get(message.guild.id, mentionedUser.id);

        if (afkStatus.afk != null) {
            const d = new Date(afkStatus.afk_time);
            message.reply(`${dnd} ${mentionedUser.username} is afk${afkStatus.afk ? `: ${afkStatus.afk} -` : '!'} **${moment(d).fromNow()}**`);
        }
    }

    // Get disabled commands
    let disabledCommands = client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
    if (typeof disabledCommands === 'string') disabledCommands = disabledCommands.split(' ');

    // Get points
    const {
        point_tracking: pointTracking, message_points: messagePoints, command_points: commandPoints,
    } = client.db.settings.selectPoints.get(message.guild.id);

    // Command handler
    const prefix = client.db.settings.selectPrefix.pluck().get(message.guild.id);
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${prefix.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    )})\\s*`);

    if (prefixRegex.test(message.content)) {
        // Get mod channels
        let modChannelIds = client.db.settings.selectModChannelIds
            .pluck()
            .get(message.guild.id) || [];
        if (typeof modChannelIds === 'string') modChannelIds = modChannelIds.split(' ');

        const [, match] = message.content.match(prefixRegex);
        const args = message.content.slice(match.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        let command = client.commands.get(cmd) || client.aliases.get(cmd); // If command not found, check aliases

        if (command && !disabledCommands.includes(command.name)) {

            // Check if the run method is implemented
            if (typeof command.run !== 'function') return;

            //Blacklisted user
            if (command.checkBlacklist(message.author)) return message
                .reply({
                    embeds: [new EmbedBuilder().setDescription(`${fail} You are blacklisted.  ${client.owners[0] && `For appeals, contact ${client.owners[0]}`}`),],
                })
                .then((msg) => {
                    setTimeout(() => msg.delete(), 15000);
                });

            // check cooldown
            const cooldown = await command.isOnCooldown(message.author.id);
            if (cooldown) return message
                .reply({
                    embeds: [new EmbedBuilder().setDescription(`${fail} You are on a cooldown. Try again in **${cooldown}** seconds.`),],
                })
                .then((msg) => {
                    setTimeout(() => msg.delete(), 3000);
                });

            // check if an instance of the command is already running
            const instanceExists = command.isInstanceRunning(message.author.id, message.channel.id);
            if (instanceExists) return message
                .reply({
                    embeds: [new EmbedBuilder().setDescription(`${fail} Command already in progress, please wait for it.`),],
                })
                .then((msg) => {
                    setTimeout(() => msg.delete(), 3000);
                });

            // Check if mod channel
            if (modChannelIds.includes(message.channel.id)) {
                if (command.type !== client.types.MOD || (command.type === client.types.MOD && message.channel
                    .permissionsFor(message.author)
                    .missing(command.userPermissions) !== 0)) {
                    // Update points with messagePoints value
                    if (pointTracking) client.db.users.updatePoints.run({points: messagePoints}, message.author.id, message.guild.id);
                    return message.channel
                        .send(`${fail} This is a mod-only channel. Only Mod commands may be used in this channel.\nTo reset this, an admin has to use \`${prefix}clearcommandchanels\` in another channel`)
                        .then((m) => setTimeout(() => m.delete(), 15000)); // Return early so bot doesn't respond
                }
            }
            // Check permissions
            const permissionErrors = command.checkPermissionErrors(message.member, message.channel, message.guild);
            console.log(permissionErrors);
            if (!permissionErrors) return;
            if (permissionErrors instanceof EmbedBuilder) return message.reply({embeds: [permissionErrors]});


            // check nsfw channel
            if (!command.checkNSFW(message.channel)) return message.reply({
                embeds: [new EmbedBuilder()
                    .setAuthor({
                        name: `${message.author.username}#${message.author.discriminator}`,
                        iconURL: message.author.displayAvatarURL(),
                    })
                    .setDescription(`${nsfw} NSFW Commands can only be run in NSFW channels.`)
                    .setTimestamp()
                    .setColor('Red'),],
            });

            // Check if command is voice channel only
            if (!command.checkVoiceChannel(message)) return command.sendReplyAndDelete(message, 'You must be in a voice channel to use this command.');


            // Update points with commandPoints value
            if (pointTracking) client.db.users.updatePoints.run({points: commandPoints}, message.author.id, message.guild.id);

            message.command = true; // Add flag for messageUpdate event
            await message.channel.sendTyping();

            if (command.exclusive) command.setInstance(message.author.id); // Track user instance
            if (command.channelExclusive) command.setInstance(null, message.channel.id); // Track channel instance
            command.setCooldown(message.author.id);

            return command.run(message, args); // Run command
        }
        else if ((message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) && message.channel
            .permissionsFor(message.guild.members.me)
            .has(['SEND_MESSAGES', 'EMBED_LINKS']) && !modChannelIds.includes(message.channel.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`Hi, I'm ${client.name}. Need help?`)
                .setThumbnail('https://i.imgur.com/B0XSinY.png')
                .setDescription(`You can see everything I can do by using the \`${prefix}help\` command.`)
                .addField('Invite Me', oneLine`
          You can add me to your server by clicking 
          [here](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot%20applications.commands)!
        `)
                .addField('Support', oneLine`
          If you have questions, suggestions, or found a bug, please use the 'report' or 'feedback' commands`)
                .setColor(message.guild.members.me.displayHexColor);
            if (client.owners.length) {
                await embed.setFooter({
                    text: `To speak directly with the developer, DM ${client.owners[0]}`,
                });
            }
            message.channel.send({embeds: [embed]});
        }
    }

    // Update points with messagePoints value
    if (pointTracking) client.db.users.updatePoints.run({points: messagePoints}, message.author.id, message.guild.id);
};
