const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    channel: {
        set: 'setwelcomechannel',
        clear: 'clearwelcomechannel',
    },
    message: {
        set: 'setwelcomemessage',
        clear: 'clearwelcomemessage',
    }
};

module.exports = class WelcomeSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'welcome-settings',
            description: 'Welcome Management - Farewell posts a message to the farewell channel when a member joins the server',
            type: client.types.ADMIN,
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
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(commandMappings[interaction.options.getSubcommandGroup()][interaction.options.getSubcommand()]);
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply('Invalid command - Potential mapping error');
        }
    }
};
