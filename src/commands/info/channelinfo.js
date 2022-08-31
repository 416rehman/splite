const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const moment = require('moment');
const {voice} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');
const channelTypes = {
    DM: 'DM',
    GUILD_TEXT: 'Text',
    GUILD_VOICE: 'Voice',
    GUILD_CATEGORY: 'Category',
    GUILD_NEWS: 'News',
    GUILD_STORE: 'Store',
    GUILD_STAGE_VOICE: 'Stage',
    GUILD_PUBLIC_THREAD: 'Public Thread',
    GUILD_NEWS_THREAD: 'News Thread',
    GUILD_PRIVATE_THREAD: 'Private Thread',
    UNKNOWN: 'Unknown',
};

module.exports = class ChannelInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'channelinfo',
            aliases: ['channel', 'ci'],
            usage: 'channelinfo [channel mention/ID]',
            description: oneLine`
        Fetches information about the provided channel. 
        If no channel is given, the current channel will be used.
      `,
            type: client.types.INFO,
            examples: ['channelinfo #general'],
        });
    }

    run(message, args) {
        let channel =
            this.getChannelFromMention(message, args[0]) ||
            message.guild.channels.cache.get(args[0]);
        if (channel) {
            args.shift();
        }
        else channel = message.channel;
        this.handle(channel, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        this.handle(channel, interaction, true);
    }

    handle(channel, context, isInteraction) {
        const embed = new MessageEmbed()
            .setTitle('Channel Information')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addField('Channel', channel.toString(), true)
            .addField('ID', `\`${channel.id}\``, true)
            .addField('Type', `\`${channelTypes[channel.type]}\``, true)
            .addField('Members', `\`${channel.members.size}\``, true)
            .addField(
                'Bots',
                `\`${
                    [...channel.members.values()].filter((b) => b.user.bot).length
                }\``,
                true
            )
            .addField(
                'Created On',
                `\`${moment(channel.createdAt).format('MMM DD YYYY')}\``,
                true
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (channel.type === 'GUILD_TEXT') {
            embed // Text embed
                .spliceFields(3, 0, {
                    name: 'Slowmode',
                    value: `\`${channel.rateLimitPerUser}\``,
                    inline: true,
                })
                .spliceFields(6, 0, {
                    name: 'NSFW',
                    value: `\`${channel.nsfw}\``,
                    inline: true,
                });
        }
        else if (channel.type === 'GUILD_NEWS') {
            embed // News embed
                .spliceFields(6, 0, {
                    name: 'NSFW',
                    value: `\`${channel.nsfw}\``,
                    inline: true,
                });
        }
        else if (channel.type === 'GUILD_VOICE') {
            embed // Voice embed
                .spliceFields(0, 1, {
                    name: 'Channel',
                    value: `${voice} ${channel.name}`,
                    inline: true,
                })
                .spliceFields(5, 0, {
                    name: 'User Limit',
                    value: `\`${channel.userLimit}\``,
                    inline: true,
                })
                .spliceFields(6, 0, {
                    name: 'Full',
                    value: `\`${channel.full}\``,
                    inline: true,
                });
            const members = [channel.members.values()];
            if (members.length > 0)
                embed.addField(
                    'Members Joined',
                    this.client.utils
                        .trimArray([...channel.members.values()])
                        .join(' ')
                );
        }
        else {
            const payload = stripIndent`
      Please enter mention a valid text or announcement channel` +
                ' or provide a valid text, announcement, or voice channel ID';

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }
        if (channel.topic) embed.addField('Topic', channel.topic);

        const payload = {embeds: [embed]};
        this.sendReply(context, payload, isInteraction);
    }
};
