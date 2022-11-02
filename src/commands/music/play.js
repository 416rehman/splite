const {QueryType} = require('discord-player');
const Command = require('../Command');

module.exports = class MusicPlayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'play',
            aliases: ['p'],
            description: 'Play or resume a track. Specify a search query to play a track.',
            usage: 'play [song name/URL]',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
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
        if (!query) {
            const queue = this.client.player.getQueue(context.guild.id);
            if (!queue) {
                console.log('No queue found');
                return this.sendReplyAndDelete(context, `Please enter a valid search ${context.author}... try again ? ❌`);
            }
            else {
                const success = queue.setPaused(false);

                return this.sendReplyAndDelete(context, success
                    ? `Current music ${queue.current.title} resumed ✅`
                    : `Something went wrong ${context.author}... try again ? ❌`);
            }
        }

        const res = await this.client.player.search(query, {
            requestedBy: context.member, searchEngine: QueryType.AUTO,
        });

        if (!res || !res.tracks.length) return this.sendReplyAndDelete(context, `No results found ${context.author}... try again ? ❌`);

        const queue = await this.client.player.createQueue(context.guild, {
            metadata: context.channel,
        });

        try {
            if (!queue.connection) await queue.connect(context.member.voice.channel);
        }
        catch {
            await this.client.player.deleteQueue(context.guild.id);
            return this.sendReplyAndDelete(context, `I can't join the voice channel ${context.author}... try again ? ❌`);
        }

        await this.sendReply(context, `Loading your ${res.playlist ? 'playlist' : 'track'}... 🎧`);

        res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

        if (!queue.playing) await queue.play();
    }
};
