const Command = require('../Command');
module.exports = class MusicStopCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'stop',
            aliases: ['dc'],
            usage: 'stop',
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

        queue.destroy();

        this.sendReplyAndDelete(context,
            'Music stopped into this server, see you next time ✅'
        );
    }
};
