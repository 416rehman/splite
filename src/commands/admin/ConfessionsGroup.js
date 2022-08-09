const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    channel: {
        set: 'setcrownchannel',
        clear: 'clearcrownchannel',
    },
    'viewer-role': {
        set: 'setviewconfessionsrole',
        clear: 'clearviewconfessionsrole',
    }
};

module.exports = class ConfessionsSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'confession-settings',
            description: 'Confessions Management - Lets server members post confessions in the confessions channel',
            type: client.types.ADMIN,
            slashCommand: new SlashCommandBuilder().setName('confessions')
                .addSubcommandGroup((o) => o.setName('channel').setDescription('The confessions channel is where confessions will be posted')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the confessions channel - To view current channel, don\'t provide a role').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the confessions channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disables confessions - No one will be able to post confessions'))
                )
                .addSubcommandGroup((o) => o.setName('viewer-role').setDescription('The viewer role is able to view who posted a confession using the /view command')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the confession viewer role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the confessions viewer role. To view current role, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disables viewing confessions - No one will be able to view confessions'))
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
