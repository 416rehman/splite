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

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0]);
        if (!member)
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        if (isNaN(args[1]))
            return this.sendErrorMessage(
                message,
                0,
                'Please provide the amount of points to set'
            );
        message.client.db.users.setPoints.run(
            args[1],
            member.id,
            message.guild.id
        );
        const embed = new MessageEmbed()
            .setTitle('Set Points')
            .setDescription(`Successfully set ${member}'s points to ${args[1]}.`)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
