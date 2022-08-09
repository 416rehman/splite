const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {load, fail} = require('../../utils/emojis.json');

module.exports = class BirdCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bird',
            usage: 'bird',
            description: 'Finds a random bird for your viewing pleasure.',
            type: client.types.FUN,
        });
    }

    async run(message) {
        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    async handle(context, isInteraction) {
        try {
            const res = await fetch('http://shibe.online/api/birds');
            const img = (await res.json())[0];
            const payload = {
                embeds: [
                    new MessageEmbed()
                        .setTitle('🐦  Chirp!  🐦')
                        .setImage(img)
                        .setFooter({
                            text: this.getUserIdentifier(context.author),
                            iconURL: this.getAvatarURL(context.author),
                        })
                ]
            };

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }
        catch (err) {
            const payload = {
                embeds: [
                    new MessageEmbed()
                        .setTitle('Error')
                        .setDescription(fail + ' ' + err.message)
                        .setColor('RED')
                ]
            };
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }
    }
};
