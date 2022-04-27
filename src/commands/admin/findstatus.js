const Command = require('../Command.js');
const {oneLine} = require('common-tags');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const ButtonMenu = require('../ButtonMenu.js');

module.exports = class findStatusCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'findstatus',
            aliases: ['fs', 'status', 'searchstatus', 'find'],
            usage: 'findstatus <optional role> <text>',
            description: oneLine`
        Finds users whose custom status contains the provided text. If a role is provided, the search will be limited to members of that role.
        *Searches only online members.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['findstatus #general cool status'],
        });
    }

    async run(message, args) {
        let role =
            this.getRoleFromMention(message, args[0]) ||
            (await message.guild.roles.cache.get(args[0])) ||
            null;
        if (role) {
            args.shift();
            role = role.members;
        }
        else role = message.guild.members.cache;
        if (args.length <= 0)
            return message.reply(
                `${emojis.fail} Please provide text to search for.`
            );

        const query = message.content
            .slice(message.content.indexOf(args[0]), message.content.length)
            .toLowerCase();
        if (query.length > 50 || query.length < 3)
            return message.reply(
                `${emojis.fail} Please provide a text with length of 3 to 50 characters`
            );

        const embed = new MessageEmbed().setDescription(
            `${emojis.load} **Searching for users with status **\n\`\`\`${query}\`\`\``
        );
        message.channel.send({embeds: [embed]}).then(async (msg) => {
            const max = 5;

            let results = [];
            role.forEach((m) => {
                if (!m.presence) return;
                for (const activity of m.presence.activities.values()) {
                    if (
                        activity.type === 'CUSTOM' &&
                        activity.state &&
                        activity.state.toLowerCase().includes(query)
                    ) {
                        results.push({userID: m.id, status: activity.state});
                        break;
                    }
                }
            });
            results = results.map((m) => {
                return `<@${m.userID}>\n\`\`\`${m.status}\`\`\``;
            });
            if (results.length <= 0) {
                embed.setDescription(
                    `${emojis.fail} None of the online members have matching status!`
                );
                return msg.edit({embeds: [embed]});
            }
            if (results.length <= max) {
                const range =
                    results.length === 1 ? '[1]' : `[1 - ${results.length}]`;
                await msg.edit({
                    embeds: [
                        embed
                            .setTitle(`Status Search Results ${range}`)
                            .setDescription(results.join('\n'))
                            .setFooter({text: 'Only displays online users'}),
                    ],
                });
            }
            else {
                embed.setTitle('Status Search Results').setFooter({
                    text: 'Expires after two minutes. Only displays online users',
                    iconURL: message.author.displayAvatarURL(),
                });
                await msg.delete();
                new ButtonMenu(
                    message.client,
                    message.channel,
                    message.member,
                    embed,
                    results,
                    max
                );
            }
        });
    }
};
