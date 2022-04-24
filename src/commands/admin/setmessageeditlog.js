const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

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
        const messageEditLogId = message.client.db.settings.selectMessageEditLogId.pluck().get(message.guild.id);
        const oldMessageEditLog = message.guild.channels.cache.get(messageEditLogId) || '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `Logging`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))

            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        if (args.length === 0) {
            return message.channel.send({embeds: [embed.addField('Current Message Edit Log', `${oldMessageEditLog}` || '`None`').setDescription(this.description)]});
        }

        embed.setDescription(`The \`message edit log\` was successfully updated. ${success}\nUse \`clearmessageeditlog\` to clear the current \`message edit log\`.`)
        const messageEditLog = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (!messageEditLog || messageEditLog.type != 'GUILD_TEXT' || !messageEditLog.viewable)
            return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);
        message.client.db.settings.updateMessageEditLogId.run(messageEditLog.id, message.guild.id);
        message.channel.send({embeds: [embed.addField('Message Edit Log', `${oldMessageEditLog} ➔ ${messageEditLog}`)]});
    }
};
