const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearodds',
            aliases: ['oclearo', 'oco'],
            usage: 'clearodds <user mention/ID>',
            description: 'Clear the provided user\'s winning odds for gambling.',
            type: client.types.MANAGER,
            examples: ['clearodds @split'],
        });
    }


    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const userId = interaction.options.getString('userid');
        this.handle(userId, interaction);
    }

    async handle(userId, context) {
        if (!userId) {
            return this.sendErrorMessage(context, 0, 'Please mention a user or provide a valid user ID');
        }

        const member = await this.client.users.fetch(userId);
        if (!member) {
            return this.sendErrorMessage(context, 0, 'Unable to find user, please check the provided ID');
        }

        this.client.odds.delete(member.id);
        const embed = new MessageEmbed()
            .setTitle('Clear Odds')
            .setDescription(
                `Successfully cleared ${member}'s winning odds back to \`${this.client.config.stats.gambling.winOdds * 100}%\`.`
            )
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);
        this.sendReply(context, {embeds: [embed]});
    }
};
