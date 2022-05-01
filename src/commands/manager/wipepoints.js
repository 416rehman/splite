const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'wipepoints',
            aliases: ['wipep', 'wp'],
            usage: 'wipepoints <user mention/ID>',
            description: 'Wipes the provided user\'s points.',
            type: client.types.MANAGER,
            examples: ['wipepoints @split'],
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
        message.client.db.users.wipePoints.run(member.id, message.guild.id);
        const embed = new MessageEmbed()
            .setTitle('Wipe Points')
            .setDescription(`Successfully wiped ${member}'s points.`)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
