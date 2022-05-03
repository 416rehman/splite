const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine,} = require('common-tags');

module.exports = class clearRoleLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearrolelog',
            aliases: ['clearrl', 'crl'],
            usage: 'clearrolelog',
            description: oneLine`
        clears the role change log text channel for your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearrolelog'],
        });
    }

    run(message) {
        const roleLogId = message.client.db.settings.selectRoleLogId
            .pluck()
            .get(message.guild.id);
        const oldRoleLog =
            message.guild.channels.cache.get(roleLogId) || '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `Logging`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`role log\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        message.client.db.settings.updateRoleLogId.run(null, message.guild.id);
        return message.channel.send({
            embeds: [embed.addField('Role Log', `${oldRoleLog} ➔ \`None\``)],
        });
    }
};
