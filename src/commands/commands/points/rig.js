const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../../utils/emojis.json')
const cost = 100;
module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rigship',
            aliases: ['setshipodds', 'rig'],
            usage: 'rig <user mention/ID>',
            description: `Rig the 'ship' command in your favor for 30 mins. Cost: ${cost} `,
            type: client.types.POINTS,
            examples: ['rig']
        });
    }
    run(message, args) {
        let bal = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id)
        if (bal >= cost) {
            message.client.db.users.updatePoints.run({points: -cost}, message.author.id, message.guild.id)
            message.guild.shippingOdds.set(message.author.id, new Date().getTime())
            const embed = new MessageEmbed()
                .setTitle('Rig Ship')
                .setDescription(`Successfully rigged ${message.author}'s shipping odds for 30 mins.`)
                .addField('Points Remaining', `${bal - cost} ${emojis.point}`)
                .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            message.channel.send({embeds: [embed]});
        } else {
            return (message.reply(`${emojis.nep} **You need ${cost - bal} more points ${emojis.point} in this server to run this command.**\n\nTo check your points ${emojis.point}, use the \`points\` command.`))
        }

    }
};