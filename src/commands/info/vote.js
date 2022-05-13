const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class InviteMeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'vote',
            aliases: ['topgg', 'betterodds'],
            usage: 'vote',
            description: `Generates a www.top.gg link you can use to vote for ${client.name} to increase your gambling odds. Voting increases your gambling odds by 10%`,
            type: client.types.INFO,
        });
    }

    run(message) {
        const prefix = message.client.db.settings.selectPrefix
            .pluck()
            .get(message.guild.id);
        message.client.utils
            .checkTopGGVote(message.client, message.author.id)
            .then((hasVoted) => {
                const gamblingModifier = Math.ceil((this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds) * 100);
                const robbingModifier = Math.ceil((this.client.config.votePerks.robbingSuccessOdds - this.client.config.stats.robbing.successOdds) * 100);
                const embed = new MessageEmbed()
                    .setTitle('Vote On Top.gg')
                    .setThumbnail('https://top.gg/images/logoinverted.png')
                    .setDescription(
                        `Click **[here](https://top.gg/bot/${message.client.config.apiKeys.topGG.api_mode.id}/vote)** to vote. \n
                        Use the \`${prefix}odds\` command to check your odds.\n
                        ${hasVoted ? `${emojis.Voted} Your active perks: ` : 'After voting, you will receive the following perks:'}`)
                    .setURL('https://top.gg/bot/${message.client.config.apiKeys.topGG.api_mode.id}/vote')
                    .addField('Gambling Odds', `${hasVoted ? emojis.Voted : ''} +${gamblingModifier}% Boost`, true)
                    .addField('Robbing', `${hasVoted ? emojis.Voted : ''} +${robbingModifier}% Boost`, true)
                    .setFooter({
                        text: `${hasVoted ? 'You have already voted, thank you <3' : 'Perks will be activated 5 mins after voting'}`,
                        iconURL: message.author.displayAvatarURL({dynamic: true}),
                    })
                    .setTimestamp()
                    .setColor(message.guild.me.displayHexColor);
                if (!hasVoted) {
                    message.channel.send({embeds: [embed]});
                }
                else {
                    message.channel.send({
                        embeds: [
                            embed.setTitle(`${emojis.Voted} You have already voted`),
                        ],
                    });
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }
};
