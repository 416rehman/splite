const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

const rgx = /^(?:<@!?)?(\d+)>?$/;

module.exports = class WipeTotalPointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'wipetotalpoints',
            aliases: ['wipetp', 'wtp'],
            usage: 'wipetotalpoints <user mention/ID> <guild>',
            description: 'Wipes the provided user\'s points and total points in the server.',
            type: client.types.OWNER,
            examples: ['wipetotalpoints @split 668625434157776896'],
        });
    }


    run(message, args) {
        this.handle(args[0], args[1], message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const userId = interaction.options.getString('userid');
        const guildId = interaction.options.getString('guildid');
        this.handle(userId, guildId, interaction);
    }

    handle(userId, guildId, context) {
        if (!userId) {
            return this.sendErrorMessage(context, 0, 'Please mention a user or provide a valid user ID');
        }
        if (!guildId) {
            return this.sendErrorMessage(context, 0, 'Please provide a valid server ID');
        }

        const member = this.client.users.fetch(userId);
        if (!member) {
            return this.sendErrorMessage(context, 0, 'Unable to find user, please check the provided ID');
        }

        if (!rgx.test(guildId))
            return this.sendErrorMessage(
                context,
                0,
                'Please provide a valid server ID'
            );

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild)
            return this.sendErrorMessage(
                context,
                0,
                'Unable to find server, please check the provided ID'
            );

        this.client.db.users.wipeTotalPoints.run(member.id, context.guild.id);
        const embed = new MessageEmbed()
            .setTitle('Wipe Total Points')
            .setDescription(
                `Successfully wiped ${member}'s points and total points.`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);
        context.channel.send({embeds: [embed]});
    }
};
