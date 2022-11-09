const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {fail} = require('../../utils/emojis.json');

module.exports = class CatCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'cat',
            aliases: ['kitten', 'kitty'],
            usage: 'cat',
            description: 'Finds a random cat for your viewing pleasure.',
            type: client.types.FUN,
        });
    }

    async run(message) {
        await this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context) {
        try {
            const res = await fetch('https://api.thecatapi.com/v1/images/search', {
                headers: {'x-api-key': context.client.config.apiKeys.catApi},
            });
            const img = (await res.json())[0].url;
            const embed = new EmbedBuilder()
                .setTitle('🐱  Meow!  🐱')
                .setImage(img)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                });

            const payload = {
                embeds: [embed],
            }; await this.sendReply(context, payload);
        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('Red');
            const payload = {
                embeds: [embed],
            }; await this.sendReply(context, payload);
        }
    }
};
