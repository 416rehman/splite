const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const Command = require('../Command');

module.exports = class MusicNowPlayingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'nowplaying',
            aliases: ['np'],
            usage: 'nowplaying',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    run(message) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction);
    }

    handle(context) {
        const queue = this.client.player.getQueue(context.guild.id);

        if (!queue || !queue.playing)
            return this.sendReplyAndDelete(context,
                `No music currently playing ${context.author}... try again ? ❌`
            );

        const track = queue.current;

        const embed = new EmbedBuilder();

        embed.setColor('RED');
        embed.setThumbnail(track.thumbnail);
        embed.setAuthor({
            name: track.title,
            iconURL: this.client.user.displayAvatarURL({
                size: 1024,
                dynamic: true,
            }),
        });

        const methods = ['disabled', 'track', 'queue'];

        const timestamp = queue.getPlayerTimestamp();
        const trackDuration =
            timestamp.progress === 'Infinity' ? 'infinity (live)' : track.duration;

        embed.setDescription(
            `Volume **${
                queue.volume
            }**%\nDuration **${trackDuration}**\nLoop mode **${
                methods[queue.repeatMode]
            }**\nRequested by ${track.requestedBy}`
        );

        embed.setTimestamp();
        embed.setFooter({
            text: 'Music comes first - Made with heart by Zerio ❤️',
            iconURL: context.author.avatarURL({dynamic: true}),
        });

        const saveButton = new ButtonBuilder();

        saveButton.setLabel('Save this track');
        saveButton.setCustomId('saveTrack');
        saveButton.setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(saveButton);

        this.sendReply(context, {embeds: [embed], components: [row]});
    }
};
