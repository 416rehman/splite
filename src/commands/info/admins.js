const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {MessageEmbed} = require('discord.js');

module.exports = class AdminsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'admins',
            usage: 'admins',
            description: 'Displays a list of all current admins.',
            type: client.types.INFO,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
        });
    }

    run(message) {
        // Get admin role
        const adminRoleId = message.client.db.settings.selectAdminRoleId
            .pluck()
            .get(message.guild.id);
        const adminRole = message.guild.roles.cache.get(adminRoleId);

        if (!adminRoleId) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('No admin role has been set.')
                        .setDescription('To set an admin role, use the `setadminrole` command.')
                        .setColor(message.guild.me.displayHexColor),
                ]
            });
        }

        const admins = [
            ...adminRole.members.sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
                .values()
        ];

        const embed = new MessageEmbed()
            .setTitle(`Admin List [${admins.length}]`)
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .addField('Admin Role', adminRole.toString())
            .addField(
                'Admin Count',
                `**${admins.length}** out of **${message.guild.memberCount}** members`
            )
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        const interval = 25;
        if (admins.length === 0)
            message.channel.send({
                embeds: [embed.setDescription('No admins found.')],
            });
        else if (admins.length <= interval) {
            const range = admins.length == 1 ? '[1]' : `[1 - ${admins.length}]`;
            message.channel.send({
                embeds: [
                    embed
                        .setTitle(`Admin List ${range}`)
                        .setDescription(admins.join('\n')),
                ],
            });

            // Reaction Menu
        }
        else {
            embed
                .setTitle('Admin List')
                .setThumbnail(message.guild.iconURL({dynamic: true}))
                .setFooter({
                    text:
                        'Expires after two minutes.\n' + message.member.displayName,
                    iconURL: message.author.displayAvatarURL(),
                });

            new ButtonMenu(
                message.client,
                message.channel,
                message.member,
                embed,
                admins,
                interval
            );
        }
    }
};
