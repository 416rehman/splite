const Command = require("../../Command");
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

  async run(message, args) {
        const queue = this.client.player.getQueue(message.guild.id);

        if (!queue) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const success = queue.setPaused(true);

        return message.channel.send(success ? `Current music ${queue.current.title} paused ✅` : `Something went wrong ${message.author}... try again ? ❌`);
    }
};