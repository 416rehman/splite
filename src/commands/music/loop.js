const {QueueRepeatMode} = require('discord-player');
const Command = require('../Command');

module.exports = class MusicLoopCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'loop',
            aliases: ['lp', 'repeat'],
            usage: 'loop <queue>',
            examples: ['loop', 'loop queue'],
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    run(message, args) {
        const shouldLoopEntireQueue = args.join('').toLowerCase() === 'queue' || args.join('').toLowerCase() === 'q';
        this.handle(shouldLoopEntireQueue, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const shouldLoopEntireQueue = interaction.options.getBoolean('queue');
        this.handle(shouldLoopEntireQueue, interaction);
    }

    handle(shouldLoopEntireQueue, context) {
        const queue = this.client.player.getQueue(context.guild.id);
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);

        if (!queue || !queue.playing)
            return this.sendReplyAndDelete(context,
                `No music currently playing ${context.author}... try again ? ❌`
            );

        if (shouldLoopEntireQueue) {
            if (queue.repeatMode === 1)
                return this.sendReplyAndDelete(context,
                    `You must first disable the current music in the loop mode (${prefix}loop) ${context.author}... try again ? ❌`
                );

            const success = queue.setRepeatMode(
                queue.repeatMode === 0 ? QueueRepeatMode.QUEUE : QueueRepeatMode.OFF
            );

            return this.sendReplyAndDelete(context,
                success
                    ? `Repeat mode **${
                        queue.repeatMode === 0 ? 'disabled' : 'enabled'
                    }** the whole queue will be repeated endlessly 🔁`
                    : `Something went wrong ${context.author}... try again ? ❌`
            );
        }
        else {
            if (queue.repeatMode === 2)
                return this.sendReplyAndDelete(context,
                    `You must first disable the current queue in the loop mode (${prefix}loop queue) ${context.author}... try again ? ❌`
                );

            const success = queue.setRepeatMode(
                queue.repeatMode === 0 ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF
            );

            return this.sendReplyAndDelete(context,
                success
                    ? `Repeat mode **${
                        queue.repeatMode === 0 ? 'disabled' : 'enabled'
                    }** the current music will be repeated endlessly (you can loop the queue with the <queue> option) 🔂`
                    : `Something went wrong ${context.author}... try again ? ❌`
            );
        }
    }
};
