const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class SnipeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'snipe',
            usage: 'snipe',
            aliases: ['s', 'sn', 'sniper'],
            description: 'Shows the most recently deleted message in the channel',
            type: client.types.INFO,
        });
    }

    async run(message) {
        const embed = new MessageEmbed()
            .setDescription('`Sniping...`')
            .setColor('RANDOM');
        const msg = await message.channel.send({embeds: [embed]});

        const snipedMSg = message.guild.snipes.get(message.channel.id);

        if (snipedMSg && !this.client.utils.isEmptyMessage(snipedMSg)) {
            embed
                .setDescription(`${snipedMSg.content ? snipedMSg.content : ''}`)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setImage(
                    `${
                        snipedMSg.attachments.size > 0
                            ? snipedMSg.attachments.first().url
                            : ''
                    }`
                )
                .setTimestamp()
                .setAuthor({
                    name: `${snipedMSg.author.username}#${snipedMSg.author.discriminator}`,
                    iconURL: snipedMSg.author.displayAvatarURL(),
                });

            const payload = {
                embeds: [embed],
                // iterate over the attachments values and add them to files, remove the first one
                files: snipedMSg.attachments.size > 1 ? [...snipedMSg.attachments.values()].slice(1).map(a => {
                    return {
                        attachment: a.url,
                        name: a.name
                    };
                }) : [],
            };

            msg.edit(payload);
        }
        else {
            embed
                .setTitle(`${message.client.name} Sniper`)
                .setDescription(`${fail} There is nothing to snipe!`)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setTimestamp();
            msg.edit({embeds: [embed]}).then((m) => {
                setTimeout(() => m.delete(), 5000);
            });
        }
    }
};
