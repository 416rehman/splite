const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');
module.exports = class VerificationChannelSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'verification-group',
            description: 'Verification Management - Set a verification channel, message, and role to be shown and given to new members',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('verification')
                .addSubcommandGroup((o) => o.setName('channel').setDescription('The verification channel is where the message will be sent')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the verification channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the verification channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the verification channel'))
                ).addSubcommandGroup((o) => o.setName('message').setDescription('The verification message is the message that will be sent to new members')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the verification message - To view current message, don\'t provide a message').addStringOption(p => p.setName('text').setRequired(false).setDescription('The message to set as the verification message. To view current message, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the verification message'))
                ).addSubcommandGroup((o) => o.setName('role').setDescription('The verification role is the role that will be given to new members')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the verification role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('Role to give after verification. To view current role, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the verification role'))
                ),
            subCommandMappings: {
                channel: {
                    set: 'setverificationchannel',
                    clear: 'clearverificationchannel',
                },
                role: {
                    set: 'setverificationrole',
                    clear: 'clearverificationrole',
                },
                message: {
                    set: 'setverificationmessage',
                    clear: 'clearverificationmessage',
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
            interaction.reply({
                content: 'Invalid command - Potential mapping error',
                ephemeral: true,
            });
        }
    }
};
