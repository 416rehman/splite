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

        if (!queue.tracks[0])
            return this.sendReplyAndDelete(context,
                `No music in the queue after the current one ${context.author}... try again ? ❌`
            );

        queue.shuffle();

        return this.sendReplyAndDelete(context,
            `Queue shuffled **${queue.tracks.length}** song(s) ! ✅`
        );
    }
};
