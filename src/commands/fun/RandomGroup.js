const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class RandomCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'random',
            description: 'Generate a random image',
            type: client.types.FUN,
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((o) => o.setName('bird').setDescription('Generate a random bird image'))
                .addSubcommand((o) => o.setName('biryani').setDescription('Generate a random biryani image'))
                .addSubcommand((o) => o.setName('cat').setDescription('Generate a random cat image'))
                .addSubcommand((o) => o.setName('catfact').setDescription('Generate a random cat fact'))
                .addSubcommand((o) => o.setName('dadjoke').setDescription('Generate a random dad joke'))
                .addSubcommand((o) => o.setName('dog').setDescription('Generate a random dog image'))
                .addSubcommand((o) => o.setName('dogfact').setDescription('Generate a random dog fact'))
                .addSubcommand((o) => o.setName('duck').setDescription('Generate a random duck image'))
                .addSubcommand((o) => o.setName('fox').setDescription('Generate a random fox image'))
                .addSubcommand((o) => o.setName('meme').setDescription('Generate a random meme image'))
                .addSubcommand((o) => o.setName('shibe').setDescription('Generate a random shibe image'))
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
