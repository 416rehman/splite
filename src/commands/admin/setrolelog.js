const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetRoleLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setrolelog',
            aliases: ['setrl', 'srl'],
            usage: 'setrolelog <channel mention/ID>',
            description: oneLine`
        Sets the role change log text channel for your server. 
        \nUse \`clearrolelog\` to clear the current \`role log\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setrolelog #bot-log', 'clearrolelog'],
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
        const roleLogId = this.client.db.settings.selectRoleLogId.pluck().get(context.guild.id);
        const oldRoleLog = context.guild.channels.cache.get(roleLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Show current role log
        if (!channel) {
            return context.channel.send({
                embeds: [
                    embed
                        .addFields([{name: 'Current Role Log', value:  `${oldRoleLog}`}])
                        .setDescription(this.description),
                ],
            });
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != ChannelType.GuildText || !channel.viewable) {
            const payload = `${fail} I can't find that channel.`;
            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateRoleLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [embed.addFields([{name: 'Role Log', value:  `${oldRoleLog} ➔ ${channel}`}]).setDescription(
                `The \`role log\` was successfully updated. ${success}\nUse \`clearrolelog\` to clear the current \`role log\`.`
            )],
        });

        this.sendReply(context, payload);
    }
};
