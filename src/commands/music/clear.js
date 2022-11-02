const Command = require('../Command.js');
module.exports = class MusicClearCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clear',
            aliases: ['cq'],
            usage: 'clear',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    run(message) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction);
    }

    async handle(context) {
        const queue = this.client.player.getQueue(context.guild.id);

        if (!queue || !queue.playing)
            return this.sendReplyAndDelete(context, `No music currently playing ${context.author}... try again ? ❌`);

        if (!queue.tracks[0])
            return this.sendReplyAndDelete(context, `No music in the queue after the current one ${context.author}... try again ? ❌`);

        await queue.clear();

        this.sendReplyAndDelete(context, 'The queue has just been cleared 🗑️');
    }
};
