const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { fail } = require("../../utils/emojis.json");
module.exports = class SnipeCommand extends Command {
   constructor(client) {
      super(client, {
         name: "snipe",
         usage: "snipe",
         aliases: ["s", "sn", "sniper"],
         description: "Shows the most recently deleted message in the channel",
         type: client.types.INFO,
      });
   }

   async run(message) {
      const embed = new MessageEmbed()
         .setDescription("`Sniping...`")
         .setColor("RANDOM");
      const msg = await message.channel.send({ embeds: [embed] });

      const snipedMSg = message.guild.snipes.get(message.channel.id);

      if (snipedMSg && (snipedMSg.content || snipedMSg.attachments.size > 0)) {
         embed
            .setDescription(`${snipedMSg.content ? snipedMSg.content : ""}`)
            .setFooter({
               text: message.member.displayName,
               iconURL: message.author.displayAvatarURL(),
            })
            .setImage(
               `${
                  snipedMSg.attachments.size > 0
                     ? snipedMSg.attachments.first().url
                     : ""
               }`
            )
            .setTimestamp()
            .setAuthor({
               name: `${snipedMSg.author.username}#${snipedMSg.author.discriminator}`,
               iconURL: snipedMSg.author.displayAvatarURL(),
            });
         msg.edit({ embeds: [embed] });
      } else {
         embed
            .setTitle(`${message.client.name} Sniper`)
            .setDescription(`${fail} There is nothing to snipe!`)
            .setFooter({
               text: message.member.displayName,
               iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp();
         msg.edit({ embeds: [embed] }).then((m) => {
            setTimeout(() => m.delete(), 5000);
         });
      }
   }
};
