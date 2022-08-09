const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {load} = require('../../utils/emojis.json');

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

        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(async msg => {
                message.loadingMessage = msg;
                const text = await this.client.utils.replaceMentionsWithNames(
                    args.join(' '),
                    message.guild
                );
                this.handle(text, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        this.handle(text, interaction, true);
    }

    async handle(text, context, isInteraction) {
        const buffer = await this.client.utils.generateImgFlipImage(
            242461078,
            `${text}`,
            `${text}`,
            '#EBDBD1',
            '#2E251E'
        );
        const attachment = new MessageAttachment(buffer, 'changemymind.png');

        if (isInteraction) {
            context.editReply({
                files: [attachment],
            });
        }
        else {
            context.loadingMessage ? context.loadingMessage.edit({
                files: [attachment],
                embeds: []
            }) : context.channel.send({
                files: [attachment],
            });
        }
    }
};
