const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class GenerateCommandGroup2 extends Command {
    constructor(client) {
        super(client, {
            name: 'generator2',
            description: 'Image generator 2',
            type: client.types.FUN,
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((o) => o.setName('trap').setDescription('Generate a trap image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('The user to trap')))
                .addSubcommand((o) => o.setName('triggered').setDescription('Generate a triggered image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User to generate the image for')))
                .addSubcommand((o) => o.setName('trumptweet').setDescription('Generate a trump tweet image from text').addStringOption((s) => s.setName('text').setRequired(true).setDescription('The text to use')))
                .addSubcommand((o) => o.setName('wanted').setDescription('Generate a wanted image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User to generate the image for')))
                .addSubcommand((o) => o.setName('wasted').setDescription('Generate a wasted image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User to generate the image for')))
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(interaction.options.getSubcommand());
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply('Invalid command');
        }
    }
};
