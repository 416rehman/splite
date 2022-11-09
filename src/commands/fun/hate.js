const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class HateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'hate',
            aliases: ['fuck', 'allmyhomies', 'homies'],
            usage: 'hate <text>',
            description:
                'Generates an "all my homies hate" image with provided text',
            type: client.types.FUN,
            examples: [`hate ${client.name} is the best bot!`],
            cooldown: 5,
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Hate', this)]});

        const text = await this.client.utils.replaceMentionsWithNames(
            args.join(' '),
            message.guild
        );
        await this.handle(text, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        await this.handle(text, interaction);
    }

    async handle(text, context) {
        const buffer = await this.client.utils.generateImgFlipImage(
            this.client,
            242461078,
            `${text}`,
            `${text}`,
            '#EBDBD1',
            '#2E251E'
        );
        const attachment = new AttachmentBuilder(buffer, {name: 'changemymind.png'});
        const payload = {
            files: [attachment],
        };
        this.sendReply(context, payload);
    }
};
