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

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        if (timestamp.progress === 'Infinity')
            return this.sendReplyAndDelete(context, 'Playing a live, no data to display 🎧');

        this.sendReplyAndDelete(context, `${progress} (**${timestamp.progress}**%)`);
    }
};
