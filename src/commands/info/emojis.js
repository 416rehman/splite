const Command = require("../Command.js");
const ButtonMenu = require("../ButtonMenu.js");
const { MessageEmbed } = require("discord.js");

module.exports = class EmojisCommand extends Command {
   constructor(client) {
      super(client, {
         name: "emojis",
         aliases: ["e"],
         usage: "emojis",
         description: "Displays a list of all current emojis.",
         type: client.types.INFO,
      });
   }

   run(message) {
      const emojis = [];
      message.guild.emojis.cache.forEach((e) =>
         emojis.push(`${e} **-** \`:${e.name}:\``)
      );

      const embed = new MessageEmbed()
         .setTitle(`Emoji List [${message.guild.emojis.cache.size}]`)
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      const interval = 25;
      if (emojis.length === 0)
         message.channel.send({
            embeds: [embed.setDescription("No emojis found. 😢")],
         });
      else if (emojis.length <= interval) {
         const range = emojis.length == 1 ? "[1]" : `[1 - ${emojis.length}]`;
         message.channel.send({
            embeds: [
               embed
                  .setTitle(`Emoji List ${range}`)
                  .setDescription(emojis.join("\n"))
                  .setThumbnail(message.guild.iconURL({ dynamic: true })),
            ],
         });

         // Reaction Menu
      } else {
         embed
            .setTitle("Emoji List")
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({
               text:
                  "Expires after two minutes.\n" + message.member.displayName,
               iconURL: message.author.displayAvatarURL(),
            });

         new ButtonMenu(
            message.client,
            message.channel,
            message.member,
            embed,
            emojis,
            interval
         );
      }
   }
};
