const Command = require('../Command.js');
const {EmbedBuilder, AttachmentBuilder} = require('discord.js');
const {load} = require('../../utils/emojis.json');

module.exports = class changemymindCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'changemymind',

            usage: 'changemymind <text>',
            description: 'Generates a changemymind image with provided text',
            type: client.types.FUN,
            examples: [`changemymind ${client.name} is the best bot!`],
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Change My Mind!', this)]});

        await message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(args.join(' '), message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        await this.handle(text, interaction, true);
    }

    async handle(text, context, isInteraction) {
        const buffer = await context.client.ameApi.generate('changemymind', {
            text: text
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'changemymind.png' });

        if (isInteraction) {
            await context.editReply({
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
