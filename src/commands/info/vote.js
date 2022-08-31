const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

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
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);
        this.client.utils
            .checkTopGGVote(this.client, context.author.id)
            .then((hasVoted) => {
                const gamblingModifier = Math.ceil((this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds) * 100);
                const robbingModifier = Math.ceil((this.client.config.votePerks.robbingSuccessOdds - this.client.config.stats.robbing.successOdds) * 100);
                const embed = new MessageEmbed()
                    .setTitle('Vote On Top.gg')
                    .setThumbnail('https://top.gg/images/logoinverted.png')
                    .setDescription(
                        `Click **[here](https://top.gg/bot/${this.client.config.apiKeys.topGG.api_mode.id}/vote)** to vote. \n
                        Use the \`${prefix}odds\` command to check your odds.\n
                        ${hasVoted ? `${emojis.Voted} Your active perks: ` : 'After voting, you will receive the following perks:'}`)
                    .setURL(`https://top.gg/bot/${this.client.config.apiKeys.topGG.api_mode.id}/vote`)
                    .addField('Gambling Odds', `${hasVoted ? emojis.Voted : ''} +${gamblingModifier}% Boost`, true)
                    .addField('Robbing', `${hasVoted ? emojis.Voted : ''} +${robbingModifier}% Boost`, true)
                    .setFooter({
                        text: `${hasVoted ? 'You have already voted, thank you <3' : 'Perks will be activated 5 mins after voting'}`,
                        iconURL: this.getAvatarURL(context.author)
                    })
                    .setTimestamp();

                if (!hasVoted) {
                    const payload = {embeds: [embed]};
                    if (isInteraction) context.editReply(payload);
                    else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                }
                else {
                    const payload = {embeds: [embed.setTitle(`${emojis.Voted} You have already voted`),]};
                    if (isInteraction) context.editReply(payload);
                    else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }
};
