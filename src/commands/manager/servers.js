const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {MessageEmbed} = require('discord.js');
const moment = require('moment');

module.exports = class ServersCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'servers',
            aliases: ['servs'],
            usage: 'servers',
            description: `Displays a list of ${client.name}'s joined servers.`,
            type: client.types.MANAGER,
        });
    }

    run(message) {
        const servers = [...message.client.guilds.cache.values()]
            .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
            .map((guild) => {
                return `\`${guild.id}\` - \`${guild.memberCount}\` - **${
                    guild.name
                }** - ${moment(guild.me.joinedAt).fromNow()}`;
            });

        const embed = new MessageEmbed()
            .setTitle('Server List')
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        if (servers.length <= 25) {
            const range = servers.length === 1 ? '[1]' : `[1 - ${servers.length}]`;
            message.channel.send({
                embeds: [
                    embed
                        .setTitle(`Server List ${range}`)
                        .setDescription(servers.join('\n')),
                ],
            });
        }
        else
            new ButtonMenu(
                message.client,
                message.channel,
                message.member,
                embed,
                servers,
                25
            );
    }
};
