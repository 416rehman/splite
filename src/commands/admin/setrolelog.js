const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
        const embed = new MessageEmbed()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: context.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Show current role log
        if (!channel) {
            return context.channel.send({
                embeds: [
                    embed
                        .addField('Current Role Log', `${oldRoleLog}`)
                        .setDescription(this.description),
                ],
            });
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != 'GUILD_TEXT' || !channel.viewable) {
            const payload = `${fail} I can't find that channel.`;
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        this.client.db.settings.updateRoleLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [embed.addField('Role Log', `${oldRoleLog} ➔ ${channel}`).setDescription(
                `The \`role log\` was successfully updated. ${success}\nUse \`clearrolelog\` to clear the current \`role log\`.`
            )],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
