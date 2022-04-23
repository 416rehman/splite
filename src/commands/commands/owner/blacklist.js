const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class BlacklistCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'blacklist',
            aliases: ['obl', 'globalignore', 'oignore'],
            usage: 'blacklist <user mention/ID>',
            description: 'Blacklist a user - Splite will ignore the user commands globally.',
            type: client.types.OWNER,
            ownerOnly: true,
            examples: ['blacklist @notSplit']
        });
    }

    run(message, args) {
        const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
        if (!member)
            return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
        try {

            message.client.db.blacklist.add.run(member.id);
            const embed = new MessageEmbed()
                .setTitle('Blacklist')
                .setDescription(`Successfully blacklisted ${member}.`)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            message.channel.send({embeds: [embed]});
        } catch (e) {
            this.sendErrorMessage(message, 0, 'An error occured while blacklisting the user.', e.message)
        }
    }
};
