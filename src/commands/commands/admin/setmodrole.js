const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../../utils/emojis.json');

module.exports = class SetModRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmodrole',
            aliases: ['setmr', 'smr'],
            usage: 'setmodrole <role mention/ID>',
            description: 'Sets the `mod role` for your server.\nUse \`clearmodrole\` to clear the current `mod role`.',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setmodrole @Mod', 'clearmodrole']
        });
    }

    async run(message, args) {
        const modRoleId = message.client.db.settings.selectModRoleId.pluck().get(message.guild.id);
        const oldModRole = message.guild.roles.cache.find(r => r.id === modRoleId) || '`None`';

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))

            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL({dynamic: true})
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        if (args.length === 0) {
            return message.channel.send({embeds: [embed.addField('Current Mod Role', `${oldModRole}` || '`None`').setDescription(this.description)]});
        }

        // Update role
        embed.setDescription(`The \`mod role\` was successfully updated. ${success}\nUse \`clearmodrole\` to clear the current \`mod role\`.`)
        const modRole = await this.getRole(message, args[0])
        if (!modRole) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');
        message.client.db.settings.updateModRoleId.run(modRole.id, message.guild.id);
        message.channel.send({embeds: [embed.addField('Mod Role', `${oldModRole} ➔ ${modRole}`)]});
    }
};
