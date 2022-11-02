const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

const commandMappings = {
    channel: {
        set: 'setfarewellchannel',
        clear: 'clearfarewellchannel',
    },
    message: {
        set: 'setfarewellmessage',
        clear: 'clearfarewellmessage',
    },
    test: 'testfarewell',
};

module.exports = class FarewellSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'farewell-settings',
            description: 'Farewell Management - Farewell posts a message to the farewell channel when a member leaves the server',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('farewell')
                .addSubcommandGroup((o) => o.setName('channel').setDescription('The farewell channel is where the farewell message will be posted')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the farewell channel - To view current channel, don\'t provide a role')
                        .addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the farewell channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disables farewell - No farewell message will be posted'))
                )
                .addSubcommandGroup((o) => o.setName('message').setDescription('The message to be posted to the farewell channel')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the farewell message - To view current message, don\'t provide a message')
                        .addStringOption(p => p.setName('text').setRequired(false).setDescription('Message to display when member leaves server. Variables: ?member, ?tag, ?username ?size')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clears farewell to default message'))
                )
                .addSubcommand((o) => o.setName('test').setDescription('Test the farewell message'))
        });
    }

    interact(interaction) {
        let commandName = interaction.options.data.some(o => o.type === 'SUB_COMMAND_GROUP') ?
            commandMappings[interaction.options.getSubcommandGroup()][interaction.options.getSubcommand()] :
            commandMappings[interaction.options.getSubcommand()];

        const command = this.client.commands.get(commandName);

        if (command) command.interact(interaction);
        else interaction.reply('Invalid command - Potential mapping error');
    }
};
