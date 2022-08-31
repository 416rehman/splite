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
    'blacklist': 'blacklist',
    'whitelist': 'whitelist',
    'setcrownschedule': 'setcrownschedule',
    'odds': {
        'set': 'setodds',
        'reset': 'clearodds'
    },
    'points': {
        'set': 'setpoints'
    }
};

module.exports = class SudoCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'sudo',
            description: 'Splite Manager commands',
            type: client.types.INFO,
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
                // MANAGER COMMANDS
                .addSubcommand(c => c.setName('blacklist').setDescription('Globally blacklist a user from using the bot')
                    .addStringOption((option) => option.setName('userid').setDescription('The user to blacklist').setRequired(true))
                )
                .addSubcommand(c => c.setName('whitelist').setDescription('Globally whitelist a user from using the bot')
                    .addStringOption((option) => option.setName('userid').setDescription('The user to whitelist').setRequired(true))
                )
                .addSubcommand(c => c.setName('setcrownschedule').setDescription('Set the crown rotation schedule for a guild')
                    .addStringOption((option) => option.setName('guildid').setDescription('The guild to set the schedule for').setRequired(true))
                    .addStringOption((option) => option.setName('cron').setDescription('The cron schedule to set'))
                    .addBooleanOption((option) => option.setName('reset').setDescription('Whether to reset the schedule to default'))
                )
                .addSubcommandGroup(c => c.setName('odds').setDescription('Commands to set the gambling odds')
                    .addSubcommand(c => c.setName('set').setDescription('Set the gambling odds for a user')
                        .addStringOption((option) => option.setName('userid').setDescription('The user to set the odds for').setRequired(true))
                        .addIntegerOption((option) => option.setName('percent').setDescription('The percent to set the odds to (0-100)').setRequired(true))
                    )
                    .addSubcommand(c => c.setName('reset').setDescription('Reset the gambling odds for a user')
                        .addStringOption((option) => option.setName('userid').setDescription('The user to reset the odds for').setRequired(true))
                    )
                )
                .addSubcommandGroup(c => c.setName('points').setDescription('Commands to set the points for a user')
                    .addSubcommand(c => c.setName('set').setDescription('Set the points for a user')
                        .addStringOption((option) => option.setName('userid').setDescription('The user to set the points for').setRequired(true))
                        .addIntegerOption((option) => option.setName('amount').setDescription('The points to set the user to').setRequired(true))
                    )
                )
                .addSubcommand(c => c.setName('servers').setDescription('List all the servers the bot is in'))
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
