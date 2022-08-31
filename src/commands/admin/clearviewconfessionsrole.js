const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearViewConfessionsRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearviewconfessionsrole',
            aliases: [
                'clearvcr',
                'cvcr',
                'clearviewconfessionrole',
                'clearviewconfession',
                'clearviewconfessions',
            ],
            usage: 'clearviewconfessionsrole',
            description: oneLine`
        Clears the role whose members can use /view command to view details about a confession.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearviewconfessionsrole'],
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        const view_confessions_role =
            this.client.db.settings.selectViewConfessionsRole
                .pluck()
                .get(context.guild.id);
        const oldViewConfessionsRole =
            context.guild.roles.cache.get(view_confessions_role) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(oldViewConfessionsRole);

        const embed = new MessageEmbed()
            .setTitle('Settings: `Confessions`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`view confessions role\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Clear role
        this.client.db.settings.updateViewConfessionsRole.run(
            null,
            context.guild.id
        );

        // Update status
        const status = 'disabled';
        const statusUpdate =
            oldStatus != status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed
                .spliceFields(0, 0, {
                    name: 'Role',
                    value: `${oldViewConfessionsRole} ➔ \`None\``,
                    inline: true,
                })
                .spliceFields(2, 0, {
                    name: 'Status',
                    value: statusUpdate,
                    inline: true,
                }),],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
