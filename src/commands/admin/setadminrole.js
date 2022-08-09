const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const emojis = require('../../utils/emojis.json');

module.exports = class SetAdminRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setadminrole',
            aliases: ['setar', 'sar'],
            usage: 'setadminrole <role mention/ID>',
            description:
                'Sets the `admin role` for your server.\nTo clear the `admin role`, type `clearadminrole`',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setadminrole @Admin', 'clearadminrole'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        this.handle(role, interaction, true);
    }

    async handle(role, context, isInteraction) {
        const adminRoleId = this.client.db.settings.selectAdminRoleId
            .pluck()
            .get(context.guild.id);
        const oldAdminRole =
            context.guild.roles.cache.find((r) => r.id === adminRoleId) ||
            '`None`';

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (!role) {
            const payload = {
                embeds: [
                    embed
                        .addField('Current Admin Role', `${oldAdminRole}`)
                        .setDescription(this.description),
                ]
            };

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        // Update role
        const adminRole = isInteraction ? role : await this.getGuildRole(context.guild, role);
        if (!adminRole) {
            const payload = emojis.fail + ' Please mention a role or provide a valid role ID.';
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        this.client.db.settings.updateAdminRoleId.run(
            adminRole.id,
            context.guild.id
        );

        const payload = {
            embeds: [embed.addField('Admin Role', `${oldAdminRole} ➔ ${adminRole}`).setDescription(
                `The \`admin role\` was successfully updated. ${success}\nTo clear the \`admin role\`, type \`clearadminrole\``
            ),]
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
