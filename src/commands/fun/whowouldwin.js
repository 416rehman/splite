const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require('../../utils/emojis.json');
const fetch = require('node-fetch');
module.exports = class whowouldwinCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'whowouldwin',
            aliases: ['www', 'vs'],
            usage: 'whowouldwin <user mention/id>',
            description: 'Generates a whowouldwin image',
            type: client.types.FUN,
            examples: ['whowouldwin @split'],
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0] || this.client.db.users.getRandom.get(message.guild.id).user_id);
        const member2 =
            (await this.getGuildMember(message.guild, args[1])) || message.author;

        if (!member || !member2) return this.sendErrorMessage(message, 'Could not find the user you specified.');

        message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            })
            .then(async (msg) => {
                try {
                    const res = await fetch(
                        encodeURI(
                            `https://nekobot.xyz/api/imagegen?type=whowouldwin&user1=${this.getAvatarURL(
                                member
                            )}&user2=${this.getAvatarURL(member2)}`
                        )
                    );
                    const json = await res.json();
                    const attachment = new MessageAttachment(
                        json.message,
                        'whowouldwin.png'
                    );

                    const m = await message.channel.send({files: [attachment]});
                    if (m.channel.permissionsFor(m.guild.me).has('ADD_REACTIONS'))
                        m.react('👈').then(() => m.react('👉'));

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
