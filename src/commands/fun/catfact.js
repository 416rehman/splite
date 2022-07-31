const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {load, fail} = require('../../utils/emojis.json');

module.exports = class CatFactCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'catfact',
            aliases: ['cf'],
            usage: 'catfact',
            description: 'Says a random cat fact.',
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
            const res = await fetch('https://catfact.ninja/fact');
            const fact = (await res.json()).fact;
            const embed = new MessageEmbed()
                .setTitle('🐱  Cat Fact  🐱')
                .setDescription(fact)
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
