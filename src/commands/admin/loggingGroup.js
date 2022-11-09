const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class LoggingSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'logging-group',
            description: 'Logs Management - Logs provide a way to view the logs of the server',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('logs')
                .addSubcommandGroup((o) => o.setName('member').setDescription('The member logs provide a way to view the logs of the server')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the member logs channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disable logging for members'))
                ).addSubcommandGroup((o) => o.setName('messagedelete').setDescription('Message Delete logs when a message is deleted')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the message delete logs channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disable logging for message delete'))
                ).addSubcommandGroup((o) => o.setName('messageedit').setDescription('Message Edit logs when a message is edited')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the message edit logs channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disable logging for message edit'))
                ).addSubcommandGroup((o) => o.setName('role').setDescription('Role logs when roles are modified')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the role logs channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disable logging for role'))
                ).addSubcommandGroup((o) => o.setName('mod').setDescription('Mod logs when a user is banned, kicked, or muted')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the mod logs channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disable logging for mod'))
                ).addSubcommandGroup((o) => o.setName('nickname').setDescription('Nickname logs when a user changes their nickname')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the nickname logs channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Disable logging for nickname'))
                ),
            subCommandMappings: {
                member: {
                    set: 'setmemberlog',
                    clear: 'clearmemberlog',
                },
                messagedelete: {
                    set: 'setmessagedeletelog',
                    clear: 'clearmessagedeletelog',
                },
                messageedit: {
                    set: 'setmessageeditlog',
                    clear: 'clearmessageeditlog',
                },
                role: {
                    set: 'setrolelog',
                    clear: 'clearrolelog',
                },
                mod: {
                    set: 'setmodlog',
                    clear: 'clearmodlog',
                },
                nickname: {
                    set: 'setnicknamelog',
                    clear: 'clearnicknamelog',
                }
            }
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(this.subCommandMappings[interaction.options.getSubcommandGroup()][interaction.options.getSubcommand()]);
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply('Invalid command - Potential mapping error');
        }
    }
};
