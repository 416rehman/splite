const Command = require('../Command.js');
const { EmbedBuilder, ChannelType } = require('discord.js');
const { success, fail } = require('../../utils/emojis.json');
const { oneLine } = require('common-tags');

module.exports = class SetMessageEditLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmessageeditlog',
            aliases: ['setmsgeditlog', 'setmel', 'smel'],
            usage: 'setmessageeditlog <channel mention/ID>',
            description: oneLine`
        Sets the message edit log text channel for your server. 
        \nUse \`clearmessageeditlog\` to clear the current \`message edit log\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setmessageeditlog #bot-log', 'clearmessageeditlog']
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
        const messageEditLogId = this.client.db.settings.selectMessageEditLogId
            .pluck()
            .get(context.guild.id);
        const oldMessageEditLog =
            context.guild.channels.cache.get(messageEditLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({ dynamic: true }))

            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author)
            })
            .setTimestamp();

        // Clear if no args provided
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addFields([{
                            name: 'Current Message Edit Log',
                            value: `${oldMessageEditLog}` || '`None`'
                        }])
                        .setDescription(this.description)
                ]
            });

            this.sendReply(context, payload);
            return;
        }

        embed.setDescription(
            `The \`message edit log\` was successfully updated. ${success}\nUse \`clearmessageeditlog\` to clear the current \`message edit log\`.`
        );

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != ChannelType.GuildText || !channel.viewable) {
            const payload = `${fail} The channel must be a text channel. Please try again.`;

            this.sendReply(context, payload);
            return;
        }
        this.client.db.settings.updateMessageEditLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [
                embed.addFields({
                    name: 'Message Edit Log',
                    value: `${oldMessageEditLog} ➔ ${channel}`
                })
            ]
        });

        this.sendReply(context, payload);
    }
};
