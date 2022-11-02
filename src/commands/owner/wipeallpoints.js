const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

const rgx = /^(?:<@!?)?(\d+)>?$/;

module.exports = class WipeAllPointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'wipeallpoints',
            aliases: ['wipeap', 'wap'],
            usage: 'wipeallpoints <server ID>',
            description:
                'Wipes all members\' points in the server with the provided ID.',
            type: client.types.OWNER,
            examples: ['wipeallpoints 709992782252474429'],
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

        this.client.db.users.wipeAllPoints.run(guildId);
        const embed = new EmbedBuilder()
            .setTitle('Wipe All Points')
            .setDescription(`Successfully wiped **${guild.name}**'s points.`)
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);
        context.channel.send({embeds: [embed]});
    }
};
