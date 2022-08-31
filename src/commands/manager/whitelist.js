const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class WhitelistCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'whitelist',
            aliases: ['owl', 'globaunignore', 'ounignore'],
            usage: 'blacklist <user mention/ID>',
            description: 'Removes a user\'s blacklist status',
            type: client.types.MANAGER,
            examples: ['whitelist @Split'],
        });
    }


    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const userId = interaction.options.getString('userid');
        this.handle(userId, interaction);
    }

    handle(userId, context) {
        if (!userId) {
            return this.sendErrorMessage(context, 0, 'Please mention a user or provide a valid user ID');
        }

        const member = this.client.users.fetch(userId);
        if (!member) {
            return this.sendErrorMessage(context, 0, 'Unable to find user, please check the provided ID');
        }

        try {
            if (!this.client.isOwner(context.author)) {
                if (this.client.isManager(member))
                    return this.sendErrorMessage(
                        context,
                        0,
                        'You cannot whitelist a bot manager or owner'
                    );
            }

            this.client.db.blacklist.remove.run(member.id);
            const embed = new MessageEmbed()
                .setTitle('Whitelist')
                .setDescription(`Successfully whitelisted ${member}.`)
                .setFooter({
                    text: this.getUserIdentifier(context.member),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp()
                .setColor(context.guild.me.displayHexColor);
            this.sendReply(context, {embeds: [embed]});
        }
        catch (e) {
            this.sendErrorMessage(
                context,
                0,
                'An error occured while whitelisting the user.',
                e.context
            );
        }
    }
};
