const { QueueRepeatMode } = require("discord-player");
const Command = require("../Command");

module.exports = class MusicLoopCommand extends Command {
   constructor(client) {
      super(client, {
         name: "loop",
         aliases: ["lp", "repeat"],
         usage: "loop <queue>",
         examples: ["loop", "loop queue"],
         voiceChannelOnly: true,
         type: client.types.MUSIC,
      });
   }

   async run(message, args) {
      const queue = this.client.player.getQueue(message.guild.id);
      const prefix = message.client.db.settings.selectPrefix
         .pluck()
         .get(message.guild.id);

      if (!queue || !queue.playing)
         return message.channel.send(
            `No music currently playing ${message.author}... try again ? ❌`
         );

      if (
         args.join("").toLowerCase() === "queue" ||
         args.join("").toLowerCase() === "q"
      ) {
         if (queue.repeatMode === 1)
            return message.channel.send(
               `You must first disable the current music in the loop mode (${prefix}loop) ${message.author}... try again ? ❌`
            );

         const success = queue.setRepeatMode(
            queue.repeatMode === 0 ? QueueRepeatMode.QUEUE : QueueRepeatMode.OFF
         );

         return message.channel.send(
            success
               ? `Repeat mode **${
                    queue.repeatMode === 0 ? "disabled" : "enabled"
                 }** the whole queue will be repeated endlessly 🔁`
               : `Something went wrong ${message.author}... try again ? ❌`
         );
      } else {
         if (queue.repeatMode === 2)
            return message.channel.send(
               `You must first disable the current queue in the loop mode (${prefix}loop queue) ${message.author}... try again ? ❌`
            );

         const success = queue.setRepeatMode(
            queue.repeatMode === 0 ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF
         );

         return message.channel.send(
            success
               ? `Repeat mode **${
                    queue.repeatMode === 0 ? "disabled" : "enabled"
                 }** the current music will be repeated endlessly (you can loop the queue with the <queue> option) 🔂`
               : `Something went wrong ${message.author}... try again ? ❌`
         );
      }
   }
};
