const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class YesNoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'yesno',
            aliases: ['yn'],
            usage: 'yesno',
            description: 'Fetches a gif of a yes or a no.',
            type: client.types.FUN,
            slashCommand: new SlashCommandBuilder()
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
            const res = await (await fetch('http://yesno.wtf/api/')).json();
            let answer = this.client.utils.capitalize(res.answer);
            if (answer === 'Yes') answer = '👍  ' + answer + '!  👍';
            else if (answer === 'No') answer = '👎  ' + answer + '!  👎';
            else answer = '👍  ' + answer + '...  👎';
            const img = res.image;
            const embed = new EmbedBuilder()
                .setTitle(answer)
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
