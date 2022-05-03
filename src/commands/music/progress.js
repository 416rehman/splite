const Command = require('../Command');
module.exports = class MusicProgressCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'progress',
            aliases: ['pbar'],
            usage: 'progress',
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

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        if (timestamp.progress == 'Infinity')
            return message.channel.send('Playing a live, no data to display 🎧');

        message.channel.send(`${progress} (**${timestamp.progress}**%)`);
    }
};
