const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class InviteMeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'vote',
            aliases: ['topgg', 'betterodds'],
            usage: 'vote',
            description: `Creates a www.top.gg link you can use to vote for ${client.name} to increase your gambling and robbing odds by 10%`,
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder()
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
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);
        this.client.utils
            .checkTopGGVote(this.client, context.author.id)
            .then(async (hasVoted) => {
                const gamblingModifier = Math.ceil((this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds) * 100);
                const robbingModifier = Math.ceil((this.client.config.votePerks.robbingSuccessOdds - this.client.config.stats.robbing.successOdds) * 100);
                const embed = new EmbedBuilder()
                    .setTitle('Vote On Top.gg')
                    .setThumbnail('https://top.gg/images/logoinverted.png')
                    .setDescription(
                        `Click **[here](https://top.gg/bot/${this.client.user.id}/vote)** to vote. \n
                        Use the \`${prefix}odds\` command to check your odds.\n
                        ${hasVoted ? `${emojis.Voted} Your active perks: ` : 'After voting, you will receive the following perks:'}`)
                    .setURL(`https://top.gg/bot/${this.client.user.id}/vote`)
                    .addFields(
                        {
                            name: 'Gambling Odds',
                            value: `${hasVoted ? emojis.Voted : ''} +${gamblingModifier}% Boost`,
                            inline: true
                        },
                        {
                            name: 'Robbing Odds',
                            value: `${hasVoted ? emojis.Voted : ''} +${robbingModifier}% Boost`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: `${hasVoted ? 'You have already voted, thank you <3' : 'Perks will be activated 5 mins after voting'}`,
                        iconURL: this.getAvatarURL(context.author)
                    })
                    .setTimestamp();

                if (!hasVoted) {
                    const payload = {embeds: [embed]};
                    await this.sendReply(context, payload);
                }
                else {
                    const payload = {embeds: [embed.setTitle(`${emojis.Voted} You have already voted`),]};
                    await this.sendReply(context, payload);
                }
            })
            .catch((e) => {
                this.sendErrorMessage(context, 1, 'Unable to check if you have voted', e.message);
            });
    }
};
