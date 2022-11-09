const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {fail} = require('../../utils/emojis.json');

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
        await this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context) {
        try {
            const options = {
                method: 'GET',
                headers: {Accept: 'application/json'},
            };
            const res = await fetch('https://icanhazdadjoke.com', options);

            const joke = (await res.json()).joke;

            const embed = new EmbedBuilder()
                .setDescription(joke)
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
