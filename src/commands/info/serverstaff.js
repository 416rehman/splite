const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class ServerStaffCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'serverstaff',
            aliases: ['staff'],
            usage: 'serverstaff',
            description:
                'Displays a list of all current server moderators and admins.',
            type: client.types.INFO,
        });
    }

    run(message) {
        // Get mod role
        const modRoleId = message.client.db.settings.selectModRoleId
            .pluck()
            .get(message.guild.id);
        let modRole, mods;
        if (modRoleId) modRole = message.guild.roles.cache.get(modRoleId);

        // Get admin role
        const adminRoleId = message.client.db.settings.selectAdminRoleId
            .pluck()
            .get(message.guild.id);
        let adminRole, admins;
        if (adminRoleId) adminRole = message.guild.roles.cache.get(adminRoleId);

        let modList = [],
            adminList = [];

        // Get mod list
        if (modRole)
            modList = [
                ...modRole.members.sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
                    .values()
            ];

        if (modList.length > 0)
            mods = message.client.utils.trimStringFromArray(modList, 1024);
        else mods = 'No mods found.';

        // Get admin list
        if (adminRole)
            adminList = [
                ...adminRole.members.sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
                    .values()
            ];

        if (adminList.length > 0)
            admins = message.client.utils.trimStringFromArray(adminList, 1024);
        else admins = 'No admins found.';

        const embed = new MessageEmbed()
            .setTitle(`Server Staff List [${modList.length + adminList.length}]`)
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .addField(`Admins [${adminList.length}]`, admins, true)
            .addField(`Mods [${modList.length}]`, mods, true)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
