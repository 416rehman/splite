const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

const commandMappings = {
    add: 'addemoji',
    remove: 'removeemoji',
    list: 'emojis'
};

module.exports = class EmojiCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'emoji',
            description: 'Emoji management commands - Add, remove, list',
            type: client.types.MOD,
            userPermissions: ['MANAGE_ROLES'],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((o) => o.setName('add').setDescription('Add an emoji to the server.')
                    .addStringOption(emoji => emoji.setName('emojis').setDescription('The emojis to add').setRequired(true))
                    .addStringOption(name => name.setName('name').setDescription('The name of the emoji').setRequired(false))
                )
                .addSubcommand((o) => o.setName('remove').setDescription('Remove an emoji from the server.')
                    .addStringOption(emoji => emoji.setName('emojis').setDescription('The emojis to remove').setRequired(true))
                )
                .addSubcommand((o) => o.setName('list').setDescription('List all emojis on the server.'))
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
