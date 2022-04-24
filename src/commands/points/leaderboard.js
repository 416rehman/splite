const Command = require('../Command.js');
const {ReactionMenu} = require('../ReactionMenu.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json')
const {MessageActionRow} = require("discord.js");
const {MessageButton} = require("discord.js");

module.exports = class LeaderboardCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'leaderboard',
            aliases: ['top', 'lb', 'rankings'],
            usage: 'leaderboard [member count]',
            description: oneLine`
        Displays the server points leaderboard of the provided member count. 
        If no member count is given, the leaderboard will default to size 10.
        The max leaderboard size is 25.
      `,
            type: client.types.POINTS,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            examples: ['leaderboard 20']
        });
    }

    async run(message, args) {
        if (message.guild.members.cache.size === message.guild.memberCount)
            console.log(`CACHE COMPLETE`);

        let max = parseInt(args[0]);
        if (!max || max < 0) max = 10;
        else if (max > 25) max = 25;
        let leaderboard = message.client.db.users.selectLeaderboard.all(message.guild.id);
        const position = leaderboard.map(row => row.user_id).indexOf(message.author.id);

        const members = [];
        let count = 1;
        for (const row of leaderboard) {
            members.push(oneLine`**${count}.** ${await message.guild.members.cache.get(row.user_id)} - \`${row.points}\` ${emojis.point}`);
            count++;
        }

        const embed = new MessageEmbed()
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setFooter({
                text: `${message.member.displayName}'s position: ${position + 1}`,
                iconURL: message.author.displayAvatarURL({dynamic: true})
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);


        if (members.length <= max) {
            const range = (members.length == 1) ? '[1]' : `[1 - ${members.length}]`;
            message.channel.send({
                embeds: [embed
                    .setTitle(`Points Leaderboard ${range}`)
                    .setDescription(members.join('\n'))
                ]
            });

            // Reaction Menu
        } else {
            embed
                .setTitle('Points Leaderboard')
                .setThumbnail(message.guild.iconURL({dynamic: true}))
                .setFooter({
                    text: 'Expires after two minutes.\n' + `${message.member.displayName}'s position: ${position + 1}`,
                    iconURL: message.author.displayAvatarURL({dynamic: true})
                });

            const activityButton = new MessageButton().setCustomId(`activity`).setLabel(`Activity Leaderboard`).setStyle('SECONDARY')
            activityButton.setEmoji(emojis.info.match(/(?<=\:)(.*?)(?=\>)/)[1].split(':')[1])
            const moderationButton = message.member.permissions.has('VIEW_AUDIT_LOG') && new MessageButton().setCustomId('moderations').setLabel(`Moderation Leaderboard`).setStyle('SECONDARY')

            const row = new MessageActionRow();
            row.addComponents(activityButton)
            if (moderationButton) {
                moderationButton.setEmoji(emojis.mod.match(/(?<=\:)(.*?)(?=\>)/)[1].split(':')[1])
                row.addComponents(moderationButton)
            }

            new ReactionMenu(message.client, message.channel, message.member, embed, members, max, null, null, 120000, [row], msg => {
                const filter = (button) => button.user.id === message.author.id;
                const collector = msg.createMessageComponentCollector({
                    filter,
                    componentType: 'BUTTON',
                    time: 120000,
                    dispose: true
                });
                collector.on('collect', b => {
                    if (b.customId === 'activity') {
                        message.client.commands.get('activity').run(message, ['all'])
                        msg.delete()
                    } else if (b.customId === 'moderations') {
                        message.client.commands.get('modactivity').run(message, [])
                        msg.delete()
                    }
                })
            });
        }
    }
};
