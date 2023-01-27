const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetSystemChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setsystemchannel',
            aliases: ['setsc', 'ssc'],
            usage: 'setsystemchannel <channel mention/ID>',
            description: oneLine`
        Sets the system text channel for your server. This is where ${client.name}'s system messages will be sent. 
        Provide no channel to clear the current \`system channel\`. Clearing this setting is **not recommended** 
        as ${client.name} requires a \`system channel\` to notify you about important errors. \n Use \`clearsystemchannel\` to clear the current \`system channel\`
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['setsystemchannel #general', 'clearsystemchannel'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel');
        this.handle(channel, interaction, true);
    }

    handle(channel, context, isInteraction) {
        const systemChannelId = this.client.db.settings.selectSystemChannelId.pluck().get(context.guild.id);
        const oldSystemChannel = context.guild.channels.cache.get(systemChannelId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Display current system channel
        if (!channel) {
            return context.channel.send({
                embeds: [
                    embed
                        .addFields([{name: 'Current System Channel', value: `${oldSystemChannel}`}])
                        .setDescription(this.description),
                ],
            });
        }
        embed.setDescription(
            `The \`system channel\` was successfully updated. ${success}\n Use \`clearsystemchannel\` to clear the current \`system channel\``
        );
        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);
        if (!channel || (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildNews) || !channel.viewable) {
            const payload = `${fail} I cannot find the channel you specified. Please try again.`;

            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateSystemChannelId.run(channel.id, context.guild.id);
        const payload = ({
            embeds: [
                embed.addFields({
                    name: 'System Channel',
                    value: `${oldSystemChannel} ➔ ${channel}`
                }),
            ],
        });

        this.sendReply(context, payload);
    }
};
