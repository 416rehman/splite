const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const {fail} = require('../../../utils/emojis.json')
module.exports = class SnipeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'editsnipe',
            usage: 'editsnipe',
            aliases: ['es', 'esn', 'esniper'],
            description: 'Shows the most recently edited message in the channel',
            type: client.types.INFO
        });
    }

    async run(message, args) {
        const embed = new MessageEmbed()
            .setDescription('`Sniping...`')
            .setColor("RANDOM");
        const msg = await message.channel.send({embeds: [embed]});


        const snipedMSg = message.guild.editSnipes.get(message.channel.id)
        if (snipedMSg && snipedMSg.newMessage && (snipedMSg.oldMessage.content)) {
            embed.setDescription(`${snipedMSg.newMessage.author} edited [message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${snipedMSg.newMessage.id})`)
                .addField('Before', snipedMSg.oldMessage.content || '')
                .addField('After', snipedMSg.newMessage.content || '')
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setImage(`${snipedMSg.newMessage.attachments.size > 0 ? snipedMSg.attachments.first().url : ''}`)
                .setTimestamp()
                .setAuthor(`${snipedMSg.newMessage.author.username}#${snipedMSg.newMessage.author.discriminator}`, `https://cdn.discordapp.com/avatars/${snipedMSg.newMessage.author.id}/${snipedMSg.newMessage.author.avatar}.png`)
            msg.edit({embeds: [embed]});
        } else {
            embed.setTitle(`${message.client.name} Sniper`)
                .setDescription(`${fail} There is nothing to snipe!`)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();
            msg.edit({embeds: [embed]}).then(m => {
                setTimeout(() => m.delete(), 5000);
            });
        }
    }
};
