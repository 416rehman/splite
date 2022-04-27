const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { fail, load } = require('../../utils/emojis.json');
const fetch = require('node-fetch');
module.exports = class trapCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'trap',
            aliases: ['trapcard'],
            usage: 'trap <user mention/id>',
            description: 'Generates a trap image',
            type: client.types.FUN,
            examples: ['trap @split'],
        });
    }

    async run(message, args) {
        const member =
         (await this.getMemberFromMention(message, args[0])) ||
         (await message.guild.members.cache.get(args[0])) ||
         message.author;
        const member2 =
         (await this.getMemberFromMention(message, args[1])) ||
         (await message.guild.members.cache.get(args[1])) ||
         message.author;

        message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            })
            .then(async (msg) => {
                try {
                    const res = await fetch(
                        encodeURI(
                            `https://nekobot.xyz/api/imagegen?type=trap&name=${
                                member2.username || member.username
                            }&author=${
                                member2 ? member.username : message.author.username
                            }&image=${
                                this.getAvatarURL(member2) || this.getAvatarURL(member)
                            }`
                        )
                    );
                    const json = await res.json();
                    const attachment = new MessageAttachment(
                        json.message,
                        'trap.png'
                    );

                    await message.channel.send({ files: [attachment] });
                    await msg.delete();
                }
                catch (e) {
                    await msg.edit({
                        embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)],
                    });
                }
            });
    }
};
