const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

const rgx = /^(?:<@!?)?(\d+)>?$/;

module.exports = class LeaveGuildCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'leaveguild',
            aliases: ['leave'],
            usage: 'leaveguild <server ID>',
            description: `Forces ${client.name} to leave the specified server.`,
            type: client.types.OWNER,
            examples: ['leaveguild 709992782252474429'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const guildId = interaction.options.getString('guildid');

        await this.handle(guildId, interaction);
    }

    async handle(guildId, context) {
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

        await guild.leave();
        const embed = new EmbedBuilder()
            .setTitle('Leave Guild')
            .setDescription(`I have successfully left **${guild.name}**.`)
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);

        await this.sendReply(context, {embeds: [embed]});
    }
};
