const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {load, fail} = require('../../utils/emojis.json');

module.exports = class ShibeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'shibe',
            usage: 'shibe',
            description: 'Finds a random shibe for your viewing pleasure.',
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
            const res = await fetch('http://shibe.online/api/shibes');
            const img = (await res.json())[0];
            const embed = new MessageEmbed()
                .setTitle('🐶  Woof!  🐶')
                .setImage(img)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                });

            if (isInteraction) {
                context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed],
                }) : context.channel.send({
                    embeds: [embed],
                });
            }
        }
        catch (err) {
            const embed = new MessageEmbed()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('RED');
            if (isInteraction) {
                context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed]
                }) : context.channel.send({
                    embeds: [embed]
                });
            }
        }
    }
};
