const Command = require('../../Command.js');
const {MessageEmbed} = require("discord.js");

module.exports = class clearafkCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearafk',
            usage: 'clearafk',
            description: '',
            type: client.types.INFO,
            examples: ['clearafk'],
            clientPermissions: [],
            userPermissions: ['KICK_MEMBERS'],
            ownerOnly: false
        });
    }

    run(message, args) {

        const member = this.getMemberFromMention(message, args[0]) || this.getMemberFromText(message, args[0]) || null
        if (!member.id) return message.reply(`Please provide a valid member to clear their afk status.`)

        message.client.db.users.updateAfk.run(null, 0, message.author.id, message.guild.id)
        if (message.member.nickname) message.member.setNickname(`${message.member.nickname.replace('[AFK]', '')}`).catch(err => {
            console.log()
        })

        const embed = new MessageEmbed()
            .setTitle('Clear AFK')
            .setDescription(`${member}'s AFK status was successfully cleared.`)
            .addField('Moderator', message.member.toString(), true)
            .addField('Member', member.toString(), true)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL({dynamic: true})
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        message.channel.send({embeds: [embed]})
        this.sendModLogMessage(message, null, {Member: member.toString()});
    }
};
