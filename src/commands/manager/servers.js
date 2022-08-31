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
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction);
    }

    handle(context) {
        const servers = [...this.client.guilds.cache.values()]
            .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
            .map((guild) => {
                return `\`${guild.id}\` - \`${guild.memberCount}\` - **${
                    guild.name
                }** - ${moment(guild.me.joinedAt).fromNow()}`;
            });

        const embed = new MessageEmbed()
            .setTitle('Server List')
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        if (servers.length <= 25) {
            const range = servers.length === 1 ? '[1]' : `[1 - ${servers.length}]`;
            this.sendReply(context, {
                embeds: [
                    embed
                        .setTitle(`Server List ${range}`)
                        .setDescription(servers.join('\n')),
                ],
            });
        }
        else
            new ButtonMenu(
                this.client,
                context.channel,
                context.member,
                embed,
                servers,
                25
            );
    }
};
