const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

const rgx = /^(?:<@!?)?(\d+)>?$/;

module.exports = class LeaveGuildCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'leaveguild',
            aliases: ['leave'],
            usage: 'leaveguild <server ID>',
            description: `Forces ${client.name} to leave the specified server.`,
            type: client.types.OWNER,
            ownerOnly: true,
            examples: ['leaveguild 709992782252474429']
        });
    }

    async run(message, args) {
        const guildId = args[0];
        if (!rgx.test(guildId))
            return this.sendErrorMessage(message, 0, 'Please provide a valid server ID');
        const guild = message.client.guilds.cache.get(guildId);
        if (!guild) return this.sendErrorMessage(message, 0, 'Unable to find server, please check the provided ID');
        await guild.leave();
        const embed = new MessageEmbed()
            .setTitle('Leave Guild')
            .setDescription(`I have successfully left **${guild.name}**.`)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
