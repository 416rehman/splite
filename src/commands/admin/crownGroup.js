const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    role: {
        set: 'setcrownrole',
        clear: 'clearcrownrole',
    },
    channel: {
        set: 'setcrownchannel',
        clear: 'clearcrownchannel',
    }
};

module.exports = class CrownSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'crown-settings',
            description: 'Crown Management - Crown provides a way to reward the most active member of the day',
            type: client.types.ADMIN,
            slashCommand: new SlashCommandBuilder().setName('crown')
                .addSubcommandGroup((o) => o.setName('role').setDescription('The crown role is given to the most active member of the day, and removed from all other members')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the crown role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the crown role. To view current role, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the crown role'))
                )
                .addSubcommandGroup((o) => o.setName('channel').setDescription('The crown channel is where the winner of the day will be announced')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the crown channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the crown channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the crown channel'))
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
