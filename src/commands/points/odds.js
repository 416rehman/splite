const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'odds',
            aliases: ['viewodds', 'perks'],
            usage: 'odds <user mention/ID>',
            description: 'View the provided user\'s winning odds when using the gamble command.',
            type: client.types.POINTS,
            examples: ['odds @split'],
        });
    }

    async run(message, args) {
        const prefix = message.client.db.settings.selectPrefix
            .pluck()
            .get(message.guild.id);
        const member = (await this.getGuildMember(message.guild, args[0])) || message.member;
        if (!member) return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
        const hasVoted = await message.client.utils.checkTopGGVote(message.client, member.id);

        const gamblingModifier = hasVoted ? this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds : 0;
        const gamblingOdds = ((message.client.odds.get(member.id)?.win || this.client.config.stats.gambling.winOdds) + gamblingModifier) * 100;
        const gamblingProgressBar = message.client.utils.createProgressBar(gamblingOdds);

        const robbingModifier = hasVoted ? this.client.config.votePerks.robbingSuccessOdds - this.client.config.stats.robbing.successOdds : 0;
        const robbingOdds = (this.client.config.stats.robbing.successOdds + robbingModifier) * 100;
        const robbingProgressBar = message.client.utils.createProgressBar(robbingOdds);

        const shipOddsTime = message.guild.shippingOdds.get(message.author.id);
        const hasRiggedShipping = shipOddsTime && new Date().getTime() - shipOddsTime < 1800000;

        const embed = new MessageEmbed()
            .setTitle(`${member.displayName}'s Odds`)
            .setDescription(
                `${hasVoted ? `${emojis.Voted} +${gamblingModifier * 100}% boost to gambling odds\n+${robbingModifier * 100}% boost to robbing odds.` : `To boost your odds, use the \`${prefix}vote\` command.`}\n` +
                `${hasRiggedShipping ? `${emojis.Voted} Ship Odds are in your favour.` : 'To rig ship odds, use the `!rig` command'}`)

            .addField('Gambling Win Odds', `**${gamblingOdds}%** ${gamblingProgressBar}\n\n**Robbing Success Odds**\n**${robbingOdds}%** ${robbingProgressBar}`)
            .addField('Voted?', `${hasVoted ? `${emojis.success}` : `${emojis.fail}`}`, true)
            .addField('Shipping Rigged?', `${hasRiggedShipping ? `${emojis.success}` : `${emojis.fail}`}`, true);

        message.channel.send({embeds: [embed]});
    }
};
