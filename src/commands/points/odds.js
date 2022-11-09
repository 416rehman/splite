const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'odds',
            aliases: ['viewodds', 'perks'],
            usage: 'odds <user mention/ID>',
            description: 'View the provided user\'s winning odds when using the gamble command.',
            type: client.types.POINTS,
            examples: ['odds @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('user').setDescription('The user to view the odds of.').setRequired(false))
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args[0])) || message.member;
        if (!member) return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');

        await this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.member;

        await this.handle(member, interaction, true);
    }

    async handle(member, context) {
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);

        const hasVoted = await this.client.utils.checkTopGGVote(this.client, member.id);

        const gamblingModifier = hasVoted ? this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds : 0;
        const gamblingOdds = ((this.client.odds.get(member.id)?.win || this.client.config.stats.gambling.winOdds) + gamblingModifier) * 100;
        const gamblingProgressBar = this.client.utils.createProgressBar(gamblingOdds);

        const robbingModifier = hasVoted ? this.client.config.votePerks.robbingSuccessOdds - this.client.config.stats.robbing.successOdds : 0;
        const robbingOdds = (this.client.config.stats.robbing.successOdds + robbingModifier) * 100;
        const robbingProgressBar = this.client.utils.createProgressBar(robbingOdds);

        const shipOddsTime = context.guild.shippingOdds.get(context.author.id);
        const hasRiggedShipping = shipOddsTime && new Date().getTime() - shipOddsTime < 1800000;

        const embed = new EmbedBuilder()
            .setTitle(`${this.getUserIdentifier(member)}'s Odds`)
            .setThumbnail(this.getAvatarURL(member))
            .setDescription(
                `${hasVoted ? `${emojis.Voted} **+${Math.ceil(gamblingModifier * 100)}**% boost to gambling odds\n${emojis.Voted} **+${Math.ceil(robbingModifier * 100)}**% boost to robbing odds.` : `To boost your odds, use the \`${prefix}vote\` command.`}\n` +
                `${hasRiggedShipping ? `${emojis.Voted} Ship Odds are in your favour.` : `To rig ship odds, use the \`${prefix}rig\` command`}`)

            .addFields([{name: 'Gambling Win Odds', value:  `**${gamblingOdds}%** ${gamblingProgressBar}\n\n**Robbing Success Odds**\n**${robbingOdds}%** ${robbingProgressBar}`}])
            .addFields([{name: 'Voted?', value:  `${hasVoted ? `${emojis.success}` : `${emojis.fail}`}`, inline:  true}])
            .addFields([{name: 'Shipping Rigged?', value:  `${hasRiggedShipping ? `${emojis.success}` : `${emojis.fail}`}`, inline:  true}])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author)
            });

        await this.sendReply(context, {embeds: [embed]});
    }
};
