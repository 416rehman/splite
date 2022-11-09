const {EmbedBuilder} = require('discord.js');
const {QueryType} = require('discord-player');
const Command = require('../Command');

module.exports = class MusicSearchCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'search',
            usage: 'search [song name]',
            voiceChannelOnly: true, type: client.types.MUSIC,
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const query = interaction.options.getString('query') || null;
        await this.handle(query, interaction);
    }

    async handle(query, context) {
        if (!query) return this.sendReplyAndDelete(context, `Please enter a valid search ${context.author}... try again ? ❌`);

        const res = await this.client.player.search(query, {
            requestedBy: context.member, searchEngine: QueryType.AUTO,
        });

        if (!res || !res.tracks.length) return this.sendReplyAndDelete(context, `No results found ${context.author}... try again ? ❌`);

        const queue = await this.client.player.createQueue(context.guild, {
            metadata: context.channel,
        });

        const embed = new EmbedBuilder();

        
        embed.setAuthor({
            name: `Results for ${query}`, iconURL: this.client.user.displayAvatarURL({
                size: 1024, dynamic: true,
            }),
        });

        const maxTracks = res.tracks.slice(0, 10);

        embed.setDescription(`${maxTracks
            .map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`)
            .join('\n')}\n\nSelect choice between **1** and **${maxTracks.length}** or **cancel** ⬇️`);

        embed.setTimestamp();
        embed.setFooter({
            text: 'Music comes first - Made with heart by Zerio ❤️', iconURL: context.author.avatarURL({dynamic: true}),
        });

        this.sendReplyAndDelete(context, {embeds: [embed]});

        const collector = context.channel.createMessageCollector({
            time: 15000, errors: ['time'], filter: (m) => m.author.id === context.author.id,
        });

        collector.on('collect', async (query) => {
            if (query.content.toLowerCase() === 'cancel') return (this.sendReplyAndDelete(context, 'Search cancelled ✅') && collector.stop());

            const value = parseInt(query.content);

            if (!value || value <= 0 || value > maxTracks.length) return this.sendReplyAndDelete(context, `Invalid response, try a value between **1** and **${maxTracks.length}** or **cancel**... try again ? ❌`);

            collector.stop();

            try {
                if (!queue.connection) await queue.connect(context.member.voice.channel);
            }
            catch {
                await this.client.player.deleteQueue(context.guild.id);
                return this.sendReplyAndDelete(context, `I can't join the voice channel ${context.author}... try again ? ❌`);
            }

            await this.sendReplyAndDelete(context, 'Loading your search... 🎧');

            queue.addTrack(res.tracks[query.content - 1]);

            if (!queue.playing) await queue.play();
        });

        collector.on('end', (msg, reason) => {
            if (reason === 'time') return this.sendReplyAndDelete(context, `Search timed out ${context.author}... try again ? ❌`);
        });
    }
};
