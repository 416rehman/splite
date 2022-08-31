const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    'blast': 'blast',
    'eval': 'eval',
    'leaveguild': 'leaveguild',
    'rebuild': 'rebuild',
    'wipe': {
        'allpoints': 'wipeallpoints',
        'totalpoints': 'wipealltotalpoints',
        'points': 'wipetotalpoints'
    },
};

module.exports = class SudoCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'sudo',
            description: 'SUDO commands',
            type: client.types.OWNER,
            slashCommand: new SlashCommandBuilder()
                .addSubcommand(c => c.setName('blast').setDescription('Blast a message to all servers')
                    .addStringOption((option) => option.setName('message').setDescription('The message to blast').setRequired(true))
                )
                .addSubcommand(c => c.setName('eval').setDescription('Evaluate a code snippet')
                    .addStringOption((option) => option.setName('code').setDescription('The code to evaluate').setRequired(true))
                )
                .addSubcommand(c => c.setName('leaveguild').setDescription('Leave a guild')
                    .addStringOption((option) => option.setName('guildid').setDescription('The guild to leave').setRequired(true))
                )
                .addSubcommand(c => c.setName('rebuild').setDescription('Rebuild all the data for a guild or user - a fresh start')
                    .addStringOption((option) => option.setName('id').setDescription('The id of the user or guild to rebuild').setRequired(true))
                )
                .addSubcommandGroup(c => c.setName('wipe').setDescription('Commands to wipe points')
                    .addSubcommand(c => c.setName('allpoints').setDescription('Wipe all points (normal points) for a guild')
                        .addStringOption((option) => option.setName('guildid').setDescription('The guild to wipe points for').setRequired(true))
                    )
                    .addSubcommand(c => c.setName('alltotalpoints').setDescription('Wipe all total points (normal and accumulated) for a guild')
                        .addStringOption((option) => option.setName('guildid').setDescription('The guild to wipe').setRequired(true))
                    )
                    .addSubcommand(c => c.setName('totalpoints').setDescription('Wipe total points (normal and accumulated) for a user')
                        .addStringOption((option) => option.setName('userid').setDescription('The user to wipe points for').setRequired(true))
                    )
                )
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
