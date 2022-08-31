const Command = require('../Command');
module.exports = class MusicSkipCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'skip',
            aliases: ['sk'],
            usage: 'skip',
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

        const success = queue.skip();

        const result =
            queue.repeatMode === 1
                ? 'This track is on repeat. Use the `repeat` command to stop repeating this track.'
                : 'Skipped ✅';
        return this.sendReplyAndDelete(context,
            success
                ? result
                : `Something went wrong ${context.author}... try again ? ❌`
        );
    }
};
