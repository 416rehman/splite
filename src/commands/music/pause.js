const Command = require('../Command');
module.exports = class MusicPauseCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'pause',
            aliases: [],
            usage: 'pause',
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

        if (!queue)
            return this.sendReplyAndDelete(context,
                `No music currently playing ${context.author}... try again ? ❌`
            );

        const success = queue.setPaused(true);

        return this.sendReplyAndDelete(context,
            success
                ? `Current music ${queue.current.title} paused ✅`
                : `Something went wrong ${context.author}... try again ? ❌`
        );
    }
};
