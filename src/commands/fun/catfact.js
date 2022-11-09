const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {fail} = require('../../utils/emojis.json');

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
        await this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context) {
        try {
            const res = await fetch('https://catfact.ninja/fact');
            const fact = (await res.json()).fact;
            const embed = new EmbedBuilder()
                .setTitle('🐱  Cat Fact  🐱')
                .setDescription(fact)
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
