const Command = require('../Command.js');


module.exports = class changemymindCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'changemymind',

            usage: 'changemymind <text>',
            description: 'Generates a changemymind image with provided text',
            type: client.types.FUN,
            examples: [`changemymind ${client.name} is the best bot!`],
            disabled: client.ameApi === null,
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Change My Mind!', this)]});

        await this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        await this.handle(text, interaction, true);
    }

    async handle(text, context) {
        await this.sendAmethystEmbed(context, 'changemymind', {text});
    }
};
