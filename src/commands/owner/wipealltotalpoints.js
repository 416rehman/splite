const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

const rgx = /^(?:<@!?)?(\d+)>?$/;

module.exports = class WipeAllTotalPointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'wipealltotalpoints',
            aliases: ['wipeatp', 'watp'],
            usage: 'wipealltotalpoints <server ID>',
            description:
                'Wipes all members\' points and total points in the server with the provided ID.',
            type: client.types.OWNER,
            examples: ['wipealltotalpoints 709992782252474429'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const guildId = interaction.options.getString('guildid');

        this.handle(guildId, interaction);
    }

    handle(guildId, context) {
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

        this.client.db.users.wipeAllTotalPoints.run(guildId);
        const embed = new MessageEmbed()
            .setTitle('Wipe All Total Points')
            .setDescription(
                `Successfully wiped **${guild.name}**'s points and total points.`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        this.sendReply(context, {embeds: [embed]});
    }
};
