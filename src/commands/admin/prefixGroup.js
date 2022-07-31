const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    set: 'setprefix',
    view: 'prefix',
};

module.exports = class PrefixSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix-settings',
            description: 'Bot prefix management',
            type: client.types.ADMIN,
            slashCommand: new SlashCommandBuilder().setName('bot-prefix')
                .addSubcommand((o) => o.setName('set').setDescription('Set the prefix for the bot').addStringOption(p => p.setName('prefix').setRequired(true).setDescription('The prefix to set')))
                .addSubcommand((o) => o.setName('view').setDescription('View the current prefix'))
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(commandMappings[interaction.options.getSubcommand()]);
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply('Invalid command - Potential mapping error');
        }
    }
};
