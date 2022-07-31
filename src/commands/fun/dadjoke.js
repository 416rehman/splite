const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {fail, load} = require('../../utils/emojis.json');

module.exports = class dadjokeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dadjoke',
            usage: 'dadjoke',
            description: 'Finds a random dadjoke.',
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
            const options = {
                method: 'GET',
                headers: {Accept: 'application/json'},
            };
            const res = await fetch('https://icanhazdadjoke.com', options);

            const joke = (await res.json()).joke;

            const embed = new MessageEmbed()
                .setDescription(joke)
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
