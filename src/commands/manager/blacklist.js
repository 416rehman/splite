const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class BlacklistCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'blacklist',
            aliases: ['obl', 'globalignore', 'oignore'],
            usage: 'blacklist <user mention/ID>',
            description:
                'Blacklist a user - User will not be able to use the bot in any server the bot is in.',
            type: client.types.MANAGER,
            examples: ['blacklist @notSplit'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const userId = interaction.options.getString('userid');
        await this.handle(userId, interaction);
    }

    async handle(userId, context) {
        if (!userId) {
            return this.sendErrorMessage(context, 0, 'Please mention a user or provide a valid user ID');
        }

        const member = await this.client.users.fetch(userId);
        if (!member) {
            return this.sendErrorMessage(context, 0, 'Unable to find user, please check the provided ID');
        }

        try {
            if (!this.client.isOwner(context.author)) {
                if (this.client.isManager(member))
                    return this.sendErrorMessage(
                        context,
                        0,
                        'You cannot blacklist a bot manager or owner'
                    );
            }

            this.client.db.blacklist.add.run(member.id);
            const embed = new EmbedBuilder()
                .setTitle('Blacklist')
                .setDescription(`Successfully blacklisted ${member}.`)
                .setFooter({
                    text: this.getUserIdentifier(context.member),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp()
                .setColor(context.guild.members.me.displayHexColor);
            await this.sendReply(context, {embeds: [embed]});
        }
        catch (e) {
            this.sendErrorMessage(
                context,
                0,
                'An error occured while blacklisting the user.',
                e.context
            );
        }
    }
};
