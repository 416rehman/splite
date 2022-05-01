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

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0]);
        if (!member)
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        message.client.odds.delete(member.id);
        const embed = new MessageEmbed()
            .setTitle('Clear Odds')
            .setDescription(
                `Successfully cleared ${member}'s winning odds back to \`55%\`.`
            )
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
