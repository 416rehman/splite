const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType} = require('discord.js');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

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
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
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

    handle(max, context) {
        if (!max || max < 0) max = 10; else if (max > 25) max = 25;
        let leaderboard = this.client.db.users.selectLeaderboard.all(context.guild.id);
        const position = leaderboard
            .map((row) => row.user_id)
            .indexOf(context.author.id);

        const members = leaderboard.map((row, idx) => {
            return oneLine`**${idx + 1}.** <@${row.user_id}> - \`${row.points}\` ${emojis.point}`;
        });

        const embed = new EmbedBuilder()
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: `${context.member.displayName}'s position: ${position + 1}`,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (members.length <= max) {
            const range = members.length === 1 ? '[1]' : `[1 - ${members.length}]`;
            const payload = {
                embeds: [embed
                    .setTitle(`Points Leaderboard ${range}`)
                    .setDescription(members.join('\n')),]
            };

            this.sendReply(context, payload);
        }
        else {
            embed
                .setTitle('Points Leaderboard')
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setFooter({
                    text: 'Expires after two minutes.\n' + `${context.member.displayName}'s position: ${position + 1}`,
                    iconURL: this.getAvatarURL(context.author),
                });

            const activityButton = new ButtonBuilder()
                .setCustomId('activity')
                .setLabel('Activity Leaderboard')
                .setStyle(ButtonStyle.Secondary);
            activityButton.setEmoji(emojis.info.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);
            const moderationButton = context.member.permissions.has('ViewAuditLog') && new ButtonBuilder()
                .setCustomId('moderations')
                .setLabel('Moderation Leaderboard')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder();
            row.addComponents(activityButton);
            if (moderationButton) {
                moderationButton.setEmoji(emojis.mod.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);
                row.addComponents(moderationButton);
            }

            this.sendReply(context, 'Leaderboard Generated!').then(() => {
                new ButtonMenu(this.client, context.channel, context.member, embed, members, max, null, 120000, [row], (msg) => {
                    const filter = (button) => button.user.id === context.author.id;
                    const collector = msg.createMessageComponentCollector({
                        filter, componentType: ComponentType.Button, time: 120000, dispose: true,
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
