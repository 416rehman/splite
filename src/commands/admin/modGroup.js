const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    role: {
        set: 'setmodrole',
        clear: 'clearmodrole',
    },
    channels: {
        set: 'setmodchannels',
        clear: 'clearmodchannels',
    }
};

module.exports = class CrownSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'mod-settings',
            description: 'Mod Management - Set the role and channel for moderators',
            type: client.types.ADMIN,
            slashCommand: new SlashCommandBuilder().setName('mod')
                .addSubcommandGroup((o) => o.setName('role').setDescription('The mod role is given to moderators, allowing them to perform moderator actions')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the mod role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the mod role. To view current role, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the mod role'))
                )
                .addSubcommandGroup((o) => o.setName('channels').setDescription('The mod channels are where moderators can run mod commands')
                    .addSubcommand((o) => o.setName('set').setDescription('Set mod channels - To view current channels, don\'t provide a channel')
                        .addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the mod channel.'))
                        .addChannelOption(p => p.setName('channel2').setRequired(false).setDescription('The channel to set as extra mod channel.'))
                        .addChannelOption(p => p.setName('channel3').setRequired(false).setDescription('The channel to set as extra mod channel.'))
                        .addChannelOption(p => p.setName('channel4').setRequired(false).setDescription('The channel to set as extra mod channel.'))
                        .addChannelOption(p => p.setName('channel5').setRequired(false).setDescription('The channel to set as extra mod channel.'))
                    )
                    .addSubcommand((o) => o.setName('clear').setDescription('Resets/clears all mod channels'))
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
