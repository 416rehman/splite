const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class ToggleTypeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'toggletype',
            aliases: ['togglet', 'togt', 'tt', 'togglecategory'],
            usage: 'toggletype <command type>',
            description: oneLine`
        Enables or disables the provided command type.
        Commands of the provided type will disabled unless they are all already disabled,
        in which case they will be enabled. 
        Disabled commands will no longer be able to be used, and will no longer show up with the \`help\` command.
        \`${client.utils.capitalize(
        client.types.ADMIN
    )}\` commands cannot be disabled.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['toggletype Fun'],
        });
    }

    run(message, args) {
        this.handle(args[0], message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const categoryName = interaction.options.getString('command');
        this.handle(categoryName, interaction, true);
    }

    handle(categoryName, context) {
        const {ADMIN, OWNER} = this.client.types;

        if (!categoryName || categoryName.toLowerCase() === OWNER.toLowerCase()) {
            const payload = new EmbedBuilder().setTitle('Invalid command type').setDescription(`${fail} Please provide a valid command type. Valid command types are: \`${Object.keys(this.client.types.filter(t => t !== OWNER && t !== ADMIN)).join('`, `')}\``);

            this.sendReply(context, payload);
        }

        const type = categoryName.toLowerCase();

        if (type === ADMIN) {
            const payload = new EmbedBuilder().setTitle('Invalid command type').setDescription(`${fail} \`${ADMIN}\` commands cannot be disabled.`);

            this.sendReply(context, payload);
            return;
        }

        let disabledCommands = this.client.db.settings.selectDisabledCommands.pluck().get(context.guild.id) || [];
        if (typeof disabledCommands === 'string') disabledCommands = disabledCommands.split(' ');

        let description;

        // Map types
        const types = Object.values(this.client.types);
        const commands = [...this.client.commands.values()].filter(
            (c) => c.type === type
        );
        const {capitalize} = this.client.utils;

        // Disable type
        if (types.includes(type)) {
            // Enable type
            if (commands.every((c) => disabledCommands.includes(c.name))) {
                for (const cmd of commands) {
                    if (disabledCommands.includes(cmd.name))
                        this.client.utils.removeElement(
                            disabledCommands,
                            cmd.name
                        );
                }
                description = `All \`${capitalize(
                    type
                )}\` type commands have been successfully **enabled**. ${success}`;

                // Disable type
            }
            else {
                for (const cmd of commands) {
                    if (!disabledCommands.includes(cmd.name))
                        disabledCommands.push(cmd.name);
                }
                description = `All \`${capitalize(
                    type
                )}\` type commands have been successfully **disabled**. ${fail}`;
            }
        }
        else {
            const payload = new EmbedBuilder().setTitle('Invalid command type').setDescription(`${fail} Please provide a valid command type. Valid command types are: \`${Object.keys(this.client.types.filter(t => t !== OWNER && t !== ADMIN)).join('`, `')}\``);

            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateDisabledCommands.run(
            disabledCommands.join(' '),
            context.guild.id
        );

        disabledCommands = disabledCommands.map((c) => `\`${c}\``).join(' ') || '`None`';
        const payload = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription('For a reference of all commands, use the `help` command.\n\n' + description)
            .addFields([{name: 'Disabled Commands', value: disabledCommands, inline: true}])
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.sendReply(context, payload);
    }
};
