const Command = require("../../Command");
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

    async run(message, args) {
        const queue = this.client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        queue.destroy();

        message.channel.send(`Music stopped into this server, see you next time ✅`);
    }
};
