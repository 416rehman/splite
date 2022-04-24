const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetCrownChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setcrownchannel',
            aliases: ['setcc', 'scc'],
            usage: 'setcrownchannel <channel mention/ID>',
            description: oneLine`
        Sets the crown message text channel for your server. 
        \nUse \`clearcrownchannel\` to clear the current \`crown channel\`.
        A \`crown message\` will only be sent if a \`crown channel\`, and \`crown role\` are set.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setcrownchannel #general', 'clearcrownchannel']
        });
    }

    run(message, args) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: crownSchedule
        } = message.client.db.settings.selectCrown.get(message.guild.id);
        const crownRole = message.guild.roles.cache.get(crownRoleId);
        const oldCrownChannel = message.guild.channels.cache.get(crownChannelId) || '`None`';

        // Get status
        const status = message.client.utils.getStatus(crownRoleId, crownSchedule);

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Crown`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .addField('Role', crownRole?.toString() || '`None`', true)
            .addField('Schedule', `\`${(crownSchedule) ? crownSchedule : 'None'}\``, true)
            .addField('Status', `\`${status}\``)
            .addField('Message', message.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear channel
        if (args.length === 0) {
            return message.channel.send({
                embeds: [embed.spliceFields(1, 0, {
                    name: 'Current Crown Channel',
                    value: `${oldCrownChannel}` || '`None`',
                    inline: true
                }).spliceFields(3, 0, {name: 'Status', value: `\`${oldStatus}\``}).setDescription(this.description)]
            });
        }
        embed.setDescription(`The \`crown channel\` was successfully updated. ${success}\nUse \`clearcrownchannel\` to clear the current \`crown channel\`.`)
        const crownChannel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (!crownChannel || (crownChannel.type != 'GUILD_TEXT' && crownChannel.type != 'GUILD_NEWS') || !crownChannel.viewable)
            return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text or announcement channel or provide a valid text or announcement channel ID
      `);

        message.client.db.settings.updateCrownChannelId.run(crownChannel.id, message.guild.id);
        message.channel.send({
            embeds: [embed.spliceFields(1, 0, {
                name: 'Channel',
                value: `${oldCrownChannel} ➔ ${crownChannel}`,
                inline: true
            })]
        });
    }
};
