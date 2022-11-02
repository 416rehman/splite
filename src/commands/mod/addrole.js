const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class AddRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'addrole',
            aliases: ['ar', 'createrole', 'cr'],
            usage: 'addrole roleName',
            description: 'Creates a new role with the provided name.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
            userPermissions: ['MANAGE_ROLES'],
            examples: ['addrole MyRole'],
        });
    }

    run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Add Role', this)]});
        const rolename = args.join(' ');
        this.handle(rolename, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const rolename = interaction.options.getString('name');
        await this.handle(rolename, interaction, true);
    }

    async handle(name, context) {
        if (name.length > 30)
            return this.sendErrorMessage(
                context,
                1,
                'Your role name must not be longer than 30 characters',
                ''
            );
        try {
            // Add role
            await context.guild.roles
                .create({
                    name: `${name}`,
                    reason: `Created By ${this.getUserIdentifier(context.author)}(${context.author.id})`,
                })
                .then((role) => {
                    const embed = new EmbedBuilder()
                        .setTitle('Add Role')
                        .setDescription(`${role} was successfully created.`)
                        .addFields([{name: 'Created By', value:  context.member.toString(), inline:  true}])
                        .addFields([{name: 'Role', value:  role.toString(), inline:  true}])
                        .setFooter({
                            text: this.getUserIdentifier(context.member),
                            iconURL: this.getAvatarURL(context.author),
                        })
                        .setTimestamp()
                        .setColor(context.guild.members.me.displayHexColor);
                    this.sendReply(context, {embeds: [embed]});

                    // Update mod log
                    this.sendModLogMessage(
                        context,
                        `Created By ${this.getUserIdentifier(context.author)}(${context.author.id})`,
                        {
                            Member: context.author,
                            Role: role,
                        }
                    );
                });
        }
        catch (err) {
            this.client.logger.error(err.stack);
            this.sendErrorMessage(
                context,
                1,
                'Please check the role hierarchy',
                err.context
            );
        }
    }
};
