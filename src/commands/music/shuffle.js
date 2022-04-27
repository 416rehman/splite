const Command = require('../Command');
module.exports = class MusicShuffleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'shuffle',
            aliases: ['sh'],
            usage: 'shuffle',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    run(message) {
        const queue = this.client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(
                `No music currently playing ${message.author}... try again ? ❌`
            );

        if (!queue.tracks[0])
            return message.channel.send(
                `No music in the queue after the current one ${message.author}... try again ? ❌`
            );

        queue.shuffle();

        return message.channel.send(
            `Queue shuffled **${queue.tracks.length}** song(s) ! ✅`
        );
    }
};
