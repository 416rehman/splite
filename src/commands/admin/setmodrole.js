const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');

module.exports = class SetModRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmodrole',
            aliases: ['setmr', 'smr'],
            usage: 'setmodrole <role mention/ID>',
            description:
                'Sets the `mod role` for your server.\nUse `clearmodrole` to clear the current `mod role`.',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setmodrole @Mod', 'clearmodrole'],
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
        const modRoleId = this.client.db.settings.selectModRoleId
            .pluck()
            .get(context.guild.id);
        const oldModRole =
            context.guild.roles.cache.find((r) => r.id === modRoleId) || '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!role) {
            const payload = {
                embeds: [
                    embed
                        .addFields([{name: 'Current Mod Role', value:  `${oldModRole}` || '`None`'}])
                        .setDescription(this.description),
                ],
            };
            return this.sendReply(context, payload);
        }

        // Update role
        const modRole = isInteraction ? role : await this.getGuildRole(context.guild, role);

        if (!modRole) {
            const payload = `${fail} Please mention a role or provide a valid role ID`;

            this.sendReply(context, payload);
            return;
        }
        this.client.db.settings.updateModRoleId.run(modRole.id, context.guild.id);

        const payload = ({
            embeds: [embed.addFields([{name: 'Mod Role', value:  `${oldModRole} ➔ ${modRole}`}])
                .setDescription(`The \`mod role\` was successfully updated. ${success}\nUse \`clearmodrole\` to clear the current \`mod role\`.`)],
        });

        this.sendReply(context, payload);
    }
};
