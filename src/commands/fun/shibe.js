const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {fail} = require('../../utils/emojis.json');

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
        await this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context) {
        try {
            const res = await fetch('http://shibe.online/api/shibes');
            const img = (await res.json())[0];
            const embed = new EmbedBuilder()
                .setTitle('🐶  Woof!  🐶')
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
