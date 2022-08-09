const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {load} = require('../../utils/emojis.json');

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

        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(args.join(' '), message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        this.handle(text, interaction, true);
    }

    async handle(text, context, isInteraction) {
        const buffer = await context.client.nekoApi.generate('clyde', {
            text: text
        });
        const attachment = new MessageAttachment(buffer, 'clyde.png');

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
