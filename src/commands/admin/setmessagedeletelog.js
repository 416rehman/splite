const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetMessageDeleteLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmessagedeletelog',
            aliases: ['setmsgdeletelog', 'setmdl', 'smdl'],
            usage: 'setmessagedeletelog <channel mention/ID>',
            description: oneLine`
        Sets the message delete log text channel for your server. 
        \nUse \`clearmessagedeletelog\` to clear the current \`message delete log\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setmessagedeletelog #bot-log', 'clearmessagedeletelog'],
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

    async handle(channel, context, isInteraction) {
        const messageDeleteLogId =
            this.client.db.settings.selectMessageDeleteLogId.pluck().get(context.guild.id);
        const oldMessageDeleteLog = context.guild.channels.cache.get(messageDeleteLogId) || '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addField(
                            'Current Message Delete Log',
                            `${oldMessageDeleteLog}` || '`None`'
                        )
                        .setDescription(this.description),
                ],
            });

            this.sendReply(context, payload);
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != ChannelType.GuildText || !channel.viewable) {
            const payload = `${fail} Please mention an accessible text channel or provide a valid text channel ID.`;

            this.sendReply(context, payload);
            return;
        }
        this.client.db.settings.updateMessageDeleteLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [
                embed.addField(
                    'Message Delete Log',
                    `${oldMessageDeleteLog} ➔ ${channel}`
                ).setDescription(
                    `The \`message delete log\` was successfully updated. ${success}\nUse \`clearmessagedeletelog\` to clear the current \`message delete log\`.`
                ),
            ],
        });

        await this.sendReplyAndDelete(context, payload);
    }
};
