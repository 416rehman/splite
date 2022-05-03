const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {permissions} = require('../../utils/constants.json');
const {oneLine} = require('common-tags');

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
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0]) || message.member;

        // Get member permissions
        const memberPermissions = member.permissions.toArray();
        const finalPermissions = [];
        for (const permission in permissions) {
            if (memberPermissions.includes(permission))
                finalPermissions.push(`+ ${permissions[permission]}`);
            else finalPermissions.push(`- ${permissions[permission]}`);
        }

        const embed = new MessageEmbed()
            .setTitle(`${member.displayName}'s Permissions`)
            .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
            .setDescription(`\`\`\`diff\n${finalPermissions.join('\n')}\`\`\``)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(member.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
