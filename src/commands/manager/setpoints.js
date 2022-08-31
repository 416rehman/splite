const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setpoints',
            aliases: ['osetp', 'osp'],
            usage: 'setpoints <user mention/ID> <amount>',
            description: 'Set the provided user\'s points.',
            type: client.types.MANAGER,
            examples: ['setpoints @split'],
        });
    }

    run(message, args) {
        this.handle(args[0], args[1], message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const userId = interaction.options.getString('userid');
        const amount = interaction.options.getInteger('amount');
        this.handle(userId, amount, interaction);
    }

    async handle(userId, amount, context) {
        if (!userId) {
            return this.sendErrorMessage(context, 0, 'Please mention a user or provide a valid user ID');
        }

        if (isNaN(amount))
            return this.sendErrorMessage(
                context,
                0,
                'Please provide the amount of points to set'
            );

        const member = await this.client.users.fetch(userId);
        console.log(member);
        if (!member) {
            return this.sendErrorMessage(context, 0, 'Unable to find user, please check the provided ID');
        }

        this.client.db.users.setPoints.run(
            amount,
            member.id,
            context.guild.id
        );
        const embed = new MessageEmbed()
            .setTitle('Set Points')
            .setDescription(`Successfully set ${member}'s points to ${amount}.`)
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.sendReply(context, {embeds: [embed]});
    }
};
