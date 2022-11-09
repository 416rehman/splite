const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class clydeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clyde',

            usage: 'clyde <text>',
            description: 'Generates a clyde image with provided text',
            type: client.types.FUN,
            examples: [`clyde ${client.name} is the best bot!`],
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Clyde Bot Message', this)]});

        await this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        await this.handle(text, interaction, true);
    }

    async handle(text, context) {
        const buffer = await context.client.nekoApi.generate('clyde', {
            text: text
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'clyde.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
