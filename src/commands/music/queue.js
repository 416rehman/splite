const { MessageEmbed } = require("discord.js");
const { fail } = require("../../utils/emojis.json");
const Command = require("../Command");
const { ReactionMenu } = require("../ReactionMenu");

module.exports = class MusicQueueCommand extends Command {
   constructor(client) {
      super(client, {
         name: "queue",
         aliases: ["q"],
         usage: "queue",
         voiceChannelOnly: true,
         type: client.types.MUSIC,
      });
   }

   async run(message, args) {
      const max = 10;
      const methods = ["", "🔂", "🔁"];

      if (!message.member.voice.channel)
         return message.channel.send(
            `${fail} - You're not in a voice channel !`
         );
      if (
         message.guild.me.voice.channel &&
         message.member.voice.channel.id !== message.guild.me.voice.channel.id
      )
         return message.channel.send(
            `${fail} - You are not in the same voice channel !`
         );

      const queue = this.client.player.getQueue(message.guild.id);

      if (!this.client.player.getQueue(message.guild.id))
         return message.channel.send(`${fail} - No songs currently playing !`);

      const q = [];
      q.push(
         `**Playing Now** : [${queue.nowPlaying().title}](${
            queue.nowPlaying().url
         })\n*\`Requested By : ${
            queue.nowPlaying().requestedBy.username
         }\`*\n\n`
      );
      queue.tracks.map((track, i) => {
         return q.push(
            `**#${track === queue.nowPlaying() ? "Playing" : i + 1}** - [${
               track.title
            }](${track.url})\n\`Requested by : ${
               track.requestedBy.username
            }\`\n`
         );
      });

      if (q.length <= max + 1) {
         const range = q.length === 1 ? "[1]" : `[1 - ${q.length}]`;
         message.channel.send({
            embeds: [
               new MessageEmbed()
                  .setTitle(
                     `Server Queue ${range} ${methods[queue.repeatMode]}`
                  )
                  .setDescription(q.join("\n")),
            ],
         });
      } else {
         const embed = new MessageEmbed()
            .setTitle(
               `Server Queue - ${q.length - 1} | ${
                  this.client.player.getQueue(message.guild.id).repeatMode
                     ? "(looped)"
                     : ""
               }`
            )
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({
               text: "Expires after two minutes.",
               iconURL: message.author.displayAvatarURL({ dynamic: true }),
            });

         new ReactionMenu(
            this.client,
            message.channel,
            message.member,
            embed,
            q,
            max
         );
      }
   }
};
