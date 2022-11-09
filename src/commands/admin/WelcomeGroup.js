const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class WelcomeSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'welcome-group',
            description: 'Welcome Management - Farewell posts a message to the farewell channel when a member joins the server',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('welcome')
                .addSubcommandGroup((o) => o.setName('channel').setDescription('Channel where new members joining the server will be announced')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the welcome channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the welcome channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the welcome channel'))
                )
                .addSubcommandGroup((o) => o.setName('message').setDescription('Message to be posted to the welcome channel')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the farewell message - To view current message, don\'t provide a message')
                        .addStringOption(p => p.setName('text').setRequired(false).setDescription('Variables: ?tag is username of the leaving user | ?size is server\'s member count.')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disables farewell - No farewell message will be posted'))
                )
                .addSubcommand((o) => o.setName('test').setDescription('Test the welcome message')),
            subCommandMappings: {
                channel: {
                    set: 'setwelcomechannel',
                    clear: 'clearwelcomechannel',
                },
                message: {
                    set: 'setwelcomemessage',
                    clear: 'clearwelcomemessage',
                },
                test: 'testwelcome',
            }
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
