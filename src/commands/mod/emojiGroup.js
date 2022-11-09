const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class EmojiCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'emoji-group',
            description: 'Emoji management commands - Add, remove, list',
            type: client.types.MOD,
            userPermissions: ['MANAGE_ROLES'],
            slashCommand: new SlashCommandBuilder().setName('emoji')
                .addSubcommand((o) => o.setName('add').setDescription('Add an emoji to the server.')
                    .addStringOption(emoji => emoji.setName('emojis').setDescription('The emojis to add').setRequired(true))
                    .addStringOption(name => name.setName('name').setDescription('The name of the emoji').setRequired(false))
                )
                .addSubcommand((o) => o.setName('remove').setDescription('Remove an emoji from the server.')
                    .addStringOption(emoji => emoji.setName('emojis').setDescription('The emojis to remove').setRequired(true))
                )
                .addSubcommand((o) => o.setName('list').setDescription('List all emojis on the server.')),
            subCommandMappings: {
                add: 'addemoji',
                remove: 'removeemoji',
                list: 'emojis'
            }
        });
    }
};
