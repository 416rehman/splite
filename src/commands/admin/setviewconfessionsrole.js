const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetViewConfessionsRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setviewconfessionsrole',
            aliases: [
                'setvcr',
                'svcr',
                'setviewconfessionrole',
                'setviewconfessions',
                'setviewconfession',
            ],
            usage: 'setviewconfessionsrole <role mention/ID>',
            description: oneLine`
        Sets the role whose members can use /view command to view details about a confession.
        \nUse \`clearviewconfessionsrole\` to clear the current \`view-confessions role\`
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: [
                'setviewconfessionsrole @admins',
                'clearviewconfessionsrole',
            ],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        await this.handle(role, interaction, true);
    }

    async handle(role, context, isInteraction) {
        const view_confessions_role =
            this.client.db.settings.selectViewConfessionsRole
                .pluck()
                .get(context.guild.id);
        const oldViewConfessionsRole = context.guild.roles.cache.get(view_confessions_role) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(view_confessions_role);

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Confessions`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Display current settings
        if (!role) {
            const payload = {
                embeds: [embed
                    .addFields([{name: 'Role', value:  oldViewConfessionsRole, inline:  true}])
                    .setDescription(this.description)
                ]
            };

            this.sendReply(context, payload);
            return;
        }

        // Update role
        embed.setDescription(
            `The \`view confessions role\` was successfully updated. ${success}\nUse \`clearviewconfessionsrole\` to clear the current \`view-confessions role\``
        );
        role = isInteraction ? role : await this.getGuildRole(context.guild, role);
        if (!role) {
            const payload = `${fail} The role you provided was not found. Please try again.`;

            this.sendReply(context, payload);
        }

        this.client.db.settings.updateViewConfessionsRole.run(role.id, context.guild.id);

        // Update status
        const status = this.client.utils.getStatus(role);
        const statusUpdate =
            oldStatus !== status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;

        const payload = ({
            embeds: [
                embed
                    .spliceFields(0, 0, {
                        name: 'Role',
                        value: `${oldViewConfessionsRole} ➔ ${role}`,
                        inline: true,
                    })
                    .spliceFields(2, 0, {
                        name: 'Status',
                        value: statusUpdate,
                        inline: true,
                    }),
            ],
        });

        await this.sendReply(context, payload);
    }
};
