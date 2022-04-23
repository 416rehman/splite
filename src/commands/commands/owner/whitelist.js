const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class WhitelistCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'whitelist',
            aliases: ['owl', 'globaunignore', 'ounignore'],
            usage: 'blacklist <user mention/ID>',
            description: 'Removes a user\'s blacklist status',
            type: client.types.OWNER,
            ownerOnly: true,
            examples: ['whitelist @Split']
        });
    }

    run(message, args) {
        const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
        if (!member)
            return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
        try {
            message.client.db.blacklist.remove.run(member.id);
            const embed = new MessageEmbed()
                .setTitle('Whitelist')
                .setDescription(`Successfully whitelisted ${member}.`)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            message.channel.send({embeds: [embed]});
        } catch (e) {
            this.sendErrorMessage(message, 0, 'An error occured while whitelisting the user.', e.message)
        }
    }
};
