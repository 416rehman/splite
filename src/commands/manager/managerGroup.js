const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class ManagerCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'manage-group',
            description: 'Manager commands',
            type: client.types.MANAGER,
            slashCommand: new SlashCommandBuilder().setName('manage')
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
                .addSubcommand(c => c.setName('servers').setDescription('List all the servers the bot is in')),
            subCommandMappings: {
                'blacklist': 'blacklist',
                'whitelist': 'whitelist',
                'setcrownschedule': 'setcrownschedule',
                'odds': {
                    'set': 'setodds',
                    'reset': 'clearodds'
                },
                'points': {
                    'set': 'setpoints'
                },
                'servers': 'servers',
            }
        });
    }
};
