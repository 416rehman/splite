const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {MessageEmbed} = require('discord.js');

module.exports = class ModsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mods',
            usage: 'mods',
            description: 'Displays a list of all current mods.',
            type: client.types.INFO,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
        });
    }

    run(message) {
        // Get mod role
        const modRoleId = message.client.db.settings.selectModRoleId
            .pluck()
            .get(message.guild.id);

        const modRole = message.guild.roles.cache.get(modRoleId);

        if (!modRole) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('No admin role has been set.')
                        .setDescription('To set a mod role, use the `setmodrole` command.')
                        .setColor(message.guild.me.displayHexColor),
                ]
            });
        }

        const mods = [
            ...modRole.members.sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
                .values()
        ];

        const embed = new MessageEmbed()
            .setTitle(`Mod List [${mods.length}]`)
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .addField('Mod Role', modRole.toString())
            .addField(
                'Mod Count',
                `**${mods.length}** out of **${message.guild.memberCount}** members`
            )
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        const interval = 25;
        if (mods.length === 0)
            message.channel.send({
                embeds: [embed.setDescription('No mods found.')],
            });
        else if (mods.length <= interval) {
            const range = mods.length == 1 ? '[1]' : `[1 - ${mods.length}]`;
            message.channel.send({
                embeds: [
                    embed
                        .setTitle(`Mod List ${range}`)
                        .setDescription(mods.join('\n')),
                ],
            });

            // Reaction Menu
        }
        else {
            embed
                .setTitle('Mod List')
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
                mods,
                interval
            );
        }
    }
};
