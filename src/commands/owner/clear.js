const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class clearCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clear',
            aliases: ['cleardata', 'clearserver', 'clearuser', 'removeData'],
            usage: 'clear <server ID>',
            description: `Removes all the server data from the database.`,
            type: client.types.OWNER,
            ownerOnly: true,
            examples: ['clear 123456789012345678']
        });
    }

    run(message, args) {
        const guild = this.client.guilds.cache.get(args[0]);
        const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
        if (!member && !guild)
            return this.sendErrorMessage(message, 0, 'Please provide a valid server ID or user ID or mention.');
        try {

            const embed = new MessageEmbed()

            if (guild) {
                this.client.db.settings.deleteGuild.run(guild.id);
                this.client.db.users.deleteGuild.run(guild.id);
                embed.setDescription(`Successfully deleted all settings and member data for **${guild.name}**.`);
            } else {
                this.client.db.deleteUser.run(member.id);
                embed.setDescription(`Successfully Cleared ${member}'s Data.`)
            }

            embed.setTitle('Clear Data')
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);

            message.channel.send({embeds: [embed]});
        } catch (e) {
            this.sendErrorMessage(message, 0, 'An error occured while clearing the data.', e.message)
        }
    }
};
