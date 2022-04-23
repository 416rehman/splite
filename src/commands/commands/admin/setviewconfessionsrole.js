const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, verify} = require('../../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetViewConfessionsRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setviewconfessionsrole',
            aliases: ['setvcr', 'svcr', 'setviewconfessionrole', 'setviewconfessions', 'setviewconfession'],
            usage: 'setviewconfessionsrole <role mention/ID>',
            description: oneLine`
        Sets the role whose members can use /view command to view details about a confession.
        \nUse \`clearviewconfessionsrole\` to clear the current \`view-confessions role\`
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setviewconfessionsrole @admins', 'clearviewconfessionsrole']
        });
    }

    async run(message, args) {
        const view_confessions_role = message.client.db.settings.selectViewConfessionsRole.pluck().get(message.guild.id);
        const oldViewConfessionsRole = message.guild.roles.cache.get(view_confessions_role) || '`None`';

        // Get status
        const oldStatus = message.client.utils.getStatus(view_confessions_role);

        const embed = new MessageEmbed()
            .setTitle('Settings: `Confessions`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))

            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear role
        if (args.length === 0) {
            return message.channel.send({
                embeds: [embed
                    .spliceFields(0, 0, {
                        name: 'Current View-Confessions Role',
                        value: `${oldViewConfessionsRole}`,
                        inline: true
                    })
                    .spliceFields(2, 0, {
                        name: 'Status',
                        value: `\`${oldStatus}\``,
                        inline: true
                    }).setDescription(this.description)
                ]
            });
        }

        // Update role
        embed.setDescription(`The \`view confessions role\` was successfully updated. ${success}\nUse \`clearviewconfessionsrole\` to clear the current \`view-confessions role\``)
        const confessionsRole = await this.getRole(message, args[0])
        if (!confessionsRole) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');
        message.client.db.settings.updateViewConfessionsRole.run(confessionsRole.id, message.guild.id);

        // Update status
        const status = message.client.utils.getStatus(confessionsRole);
        const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        message.channel.send({
            embeds: [embed
                .spliceFields(0, 0, {
                    name: 'Role',
                    value: `${oldViewConfessionsRole} ➔ ${confessionsRole}`,
                    inline: true
                })
                .spliceFields(2, 0, {name: 'Status', value: statusUpdate, inline: true})
            ]
        });
    }
};
