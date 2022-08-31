const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const moment = require('moment');
const {permissions} = require('../../utils/constants.json');

module.exports = class RoleInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'roleinfo',
            aliases: ['ri'],
            usage: 'roleinfo <role mention/ID>',
            description: 'Fetches information about the provided role.',
            type: client.types.INFO,
            examples: ['roleinfo @Member'],
        });
    }

    run(message, args) {
        const role = this.getGuildRole(message.guild, args.join(' '));
        if (!role)
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a role or provide a valid role ID'
            );

        this.handle(role, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        this.handle(role, interaction, true);
    }

    handle(role, context, isInteraction) {
        // Get role permissions
        const rolePermissions = role.permissions.toArray();
        const finalPermissions = [];
        for (const permission in permissions) {
            if (rolePermissions.includes(permission))
                finalPermissions.push(`+ ${permissions[permission]}`);
            else finalPermissions.push(`- ${permissions[permission]}`);
        }

        // Reverse role position
        const position = `\`${
            context.guild.roles.cache.size - role.position
        }\`/\`${context.guild.roles.cache.size}\``;

        const embed = new MessageEmbed()
            .setTitle('Role Information')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addField('Role', role.toString(), true)
            .addField('Role ID', `\`${role.id}\``, true)
            .addField('Position', position, true)
            .addField('Mentionable', `\`${role.mentionable}\``, true)
            .addField('Bot Role', `\`${role.managed}\``, true)
            .addField('Color', `\`${role.hexColor.toUpperCase()}\``, true)
            .addField('Members', `\`${role.members.size}\``, true)
            .addField('Hoisted', `\`${role.hoist}\``, true)
            .addField(
                'Created On',
                `\`${moment(role.createdAt).format('MMM DD YYYY')}\``,
                true
            )
            .addField(
                'Permissions',
                `\`\`\`diff\n${finalPermissions.join('\n')}\`\`\``
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        const payload = {embeds: [embed]};
        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
