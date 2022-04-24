const {QueryType} = require('discord-player');
const Command = require("../Command");

module.exports = class MusicPlayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'play',
            aliases: ['p'],
            usage: 'play [song name/URL]',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    async run(message, args) {
        if (!args[0]) return message.channel.send(`Please enter a valid search ${message.author}... try again ? ❌`);

        const res = await this.client.player.search(args.join(' '), {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) return message.channel.send(`No results found ${message.author}... try again ? ❌`);

        const queue = await this.client.player.createQueue(message.guild, {
            metadata: message.channel
        });

        try {
            if (!queue.connection) await queue.connect(message.member.voice.channel);
        } catch {
            await this.client.player.deleteQueue(message.guild.id);
            return message.channel.send(`I can't join the voice channel ${message.author}... try again ? ❌`);
        }

        await message.channel.send(`Loading your ${res.playlist ? 'playlist' : 'track'}... 🎧`);

        res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

        if (!queue.playing) await queue.play();
    }
};
