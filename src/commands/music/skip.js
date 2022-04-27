const Command = require("../Command");
module.exports = class MusicSkipCommand extends Command {
   constructor(client) {
      super(client, {
         name: "skip",
         aliases: ["sk"],
         usage: "skip",
         voiceChannelOnly: true,
         type: client.types.MUSIC,
      });
   }

   async run(message, args) {
      const queue = this.client.player.getQueue(message.guild.id);

      if (!queue || !queue.playing)
         return message.channel.send(
            `No music currently playing ${message.author}... try again ? ❌`
         );

      const success = queue.skip();

      const result =
         queue.repeatMode == 1
            ? `This track is on repeat. Use the \`repeat\` command to stop repeating this track.`
            : `Skipped ${success.user.username} ✅`;
      return message.channel.send(
         success
            ? result
            : `Something went wrong ${message.author}... try again ? ❌`
      );
   }
};
