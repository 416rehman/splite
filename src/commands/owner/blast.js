const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class BlastCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'blast',
            usage: 'blast <message>',
            description: `Sends a message to every server that ${client.name} is in that has a system channel.`,
            type: client.types.OWNER,
            examples: ['blast Hello World!'],
        });
    }

    run(message, args) {
        const messageText = args.join(' ');
        this.handle(messageText, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const messageText = interaction.options.getString('message');
        this.handle(messageText, interaction);
    }

    handle(messageText, context) {
        if (!messageText)
            return this.sendErrorMessage(
                context,
                0,
                'Please provide a context to blast'
            );

        const guilds = [];
        this.client.guilds.cache.forEach((guild) => {
            const systemChannelId =
                this.client.db.settings.selectSystemChannelId
                    .pluck()
                    .get(guild.id);
            const systemChannel = guild.channels.cache.get(systemChannelId);
            if (
                systemChannel &&
                systemChannel.viewable &&
                systemChannel
                    .permissionsFor(guild.members.me)
                    .has(['SendMessages', 'EmbedLinks'])
            ) {
                const embed = new EmbedBuilder()
                    .setTitle(`${this.client.name} System Message`)
                    .setThumbnail('https://i.imgur.com/B0XSinY.png')
                    .setDescription(messageText)
                    .setTimestamp()
                    .setFooter({
                        text: 'Don\'t want this message here? Use the "setsystemchannel" command to change it',
                    });
                systemChannel.send({embeds: [embed]});
            }
            else guilds.push(guild.name);
        });

        if (guilds.length > 0) {
            // Trim array
            const description = this.client.utils.trimStringFromArray(guilds);

            const embed = new EmbedBuilder()
                .setTitle('Blast Failures')
                .setDescription(description)
                .setFooter({
                    text: context.member.displayName,
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();
            this.sendReply(context, {embeds: [embed]});
        }

        const embed = new EmbedBuilder()
            .setTitle('Blast Success')
            .setDescription('All messages were sent successfully to **' + guilds.length + '** servers.')
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        this.sendReply(context, {embeds: [embed]});

    }
};
