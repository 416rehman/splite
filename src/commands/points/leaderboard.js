const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {MessageActionRow} = require('discord.js');
const {MessageButton} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

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
            examples: ['leaderboard 20'],
            slashCommand: new SlashCommandBuilder().addIntegerOption(i => i.setName('members').setDescription('The number of members to show in the leaderboard.').setRequired(false))
        });
    }

    run(message, args) {
        let startingAmount = parseInt(args[0]);

        this.handle(startingAmount, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const amount = interaction.options.getNumber('amount');

        this.handle(amount, interaction, true);
    }

    handle(max, context, isInteraction) {
        if (!max || max < 0) max = 10; else if (max > 25) max = 25;
        let leaderboard = this.client.db.users.selectLeaderboard.all(context.guild.id);
        const position = leaderboard
            .map((row) => row.user_id)
            .indexOf(context.author.id);

        const members = leaderboard.map((row, idx) => {
            return oneLine`**${idx + 1}.** <@${row.user_id}> - \`${row.points}\` ${emojis.point}`;
        });

        const embed = new MessageEmbed()
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: `${context.member.displayName}'s position: ${position + 1}`,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        if (members.length <= max) {
            const range = members.length === 1 ? '[1]' : `[1 - ${members.length}]`;
            const payload = {
                embeds: [embed
                    .setTitle(`Points Leaderboard ${range}`)
                    .setDescription(members.join('\n')),]
            };

            this.sendReply(context, payload, isInteraction);
        }
        else {
            embed
                .setTitle('Points Leaderboard')
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setFooter({
                    text: 'Expires after two minutes.\n' + `${context.member.displayName}'s position: ${position + 1}`,
                    iconURL: this.getAvatarURL(context.author),
                });

            const activityButton = new MessageButton()
                .setCustomId('activity')
                .setLabel('Activity Leaderboard')
                .setStyle('SECONDARY');
            activityButton.setEmoji(emojis.info.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);
            const moderationButton = context.member.permissions.has('VIEW_AUDIT_LOG') && new MessageButton()
                .setCustomId('moderations')
                .setLabel('Moderation Leaderboard')
                .setStyle('SECONDARY');

            const row = new MessageActionRow();
            row.addComponents(activityButton);
            if (moderationButton) {
                moderationButton.setEmoji(emojis.mod.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);
                row.addComponents(moderationButton);
            }

            this.sendReply(context, 'Leaderboard Generated!', isInteraction).then(() => {
                new ButtonMenu(this.client, context.channel, context.member, embed, members, max, null, 120000, [row], (msg) => {
                    const filter = (button) => button.user.id === context.author.id;
                    const collector = msg.createMessageComponentCollector({
                        filter, componentType: 'BUTTON', time: 120000, dispose: true,
                    });
                    collector.on('collect', (b) => {
                        if (b.customId === 'activity') {
                            this.client.commands
                                .get('activity')
                                .run(context, ['all']);
                            msg.delete();
                        }
                        else if (b.customId === 'moderations') {
                            this.client.commands
                                .get('modactivity')
                                .run(context, []);
                            msg.delete();
                        }
                    });
                });
            });
        }
    }
};
