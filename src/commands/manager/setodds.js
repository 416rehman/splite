const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setodds',
            aliases: ['oseto', 'oso'],
            usage: 'setodds <user mention/ID> <0-100 winning percentage>',
            description: 'Set the provided user\'s winning odds when gambling.',
            type: client.types.MANAGER,
            examples: ['setodds @split'],
        });
    }


    run(message, args) {
        this.handle(args[0], args[1], message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const userId = interaction.options.getString('userid');
        const percentage = interaction.options.getInteger('percent');
        this.handle(userId, percentage, interaction);
    }

    async handle(userId, percent, context) {
        if (!userId) {
            return this.sendErrorMessage(context, 0, 'Please mention a user or provide a valid user ID');
        }

        if (isNaN(percent))
            return this.sendErrorMessage(
                context,
                0,
                'Please provide the winning percentage to set'
            );

        const member = await this.client.users.fetch(userId);
        if (!member) {
            return this.sendErrorMessage(context, 0, 'Unable to find user, please check the provided ID');
        }

        this.client.odds.set(member.id, {
            lose: (100 - parseInt(percent)) / 100,
            win: parseInt(percent) / 100,
        });
        const embed = new MessageEmbed()
            .setTitle('Set Odds')
            .setDescription(
                `Successfully set ${member}'s winning odds to \`${percent}%\`.`
            )
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        this.sendReply(context, {embeds: [embed]});
    }
};
