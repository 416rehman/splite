const Command = require("../../Command.js");
module.exports = class MusicBackCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'back',
            aliases: ['previous'],
            usage: 'back',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    async run(message, args) {
        const queue = this.client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        if (!queue.previousTracks[1])
            return message.channel.send(`There was no music played before ${message.author}... try again ? ❌`);

        await queue.back();

        message.channel.send(`Playing the **previous** track ✅`);
    }
};
