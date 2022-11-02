const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {permissions} = require('../../utils/constants.json');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class PermissionsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'permissions',
            aliases: ['perms'],
            usage: 'permissions [user mention/ID]',
            description: oneLine`
        Displays all current permissions for the specified user. 
        If no user is given, your own permissions will be displayed.
      `,
            type: client.types.INFO,
            examples: ['permissions @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setRequired(false).setDescription('The user to get permissions for.').setName('user')),
        });
    }

    async run(message, args) {
        const user = await this.getGuildMember(message.guild, args[0]) || message.member;
        this.handle(user, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') || interaction.member;
        this.handle(user, interaction, true);
    }

    handle(member, context, isInteraction) {
        // Get member permissions
        const memberPermissions = member.permissions.toArray();
        const finalPermissions = [];
        for (const permission in permissions) {
            if (memberPermissions.includes(permission))
                finalPermissions.push(`+ ${permissions[permission]}`);
            else finalPermissions.push(`- ${permissions[permission]}`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`${member.displayName}'s Permissions`)
            .setThumbnail(this.getAvatarURL(member.user))
            .setDescription(`\`\`\`diff\n${finalPermissions.join('\n')}\`\`\``)
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
