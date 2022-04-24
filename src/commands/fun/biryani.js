const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');

module.exports = class biryaniCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'biryani',
            usage: 'biryani',
            description: 'Finds a random biryani for your viewing pleasure.',
            type: client.types.FUN
        });
    }

    async run(message, args) {
        try {
            const res = await fetch('https://biriyani.anoram.com/get');
            const img = (await res.json()).image;
            const embed = new MessageEmbed()
                .setTitle('🤤  Biryani!  🍽')
                .setImage(img)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            message.channel.send({embeds: [embed]});
        } catch (err) {
            message.client.logger.error(err.stack);
            this.sendErrorMessage(message, 1, 'Please try again in a few seconds', err.message);
        }
    }
};
