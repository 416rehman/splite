const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const emojis = require("../../utils/emojis.json");

module.exports = class WarnCommand extends Command {
   constructor(client) {
      super(client, {
         name: "testfarewell",
         aliases: ["testleave", "tleave", "tfarewell", "tf"],
         usage: "testfarewell",
         description: "Sends a test farewell message.",
         type: client.types.MOD,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
         userPermissions: ["KICK_MEMBERS"],
         examples: ["testfarewell"],
      });
   }

   run(message) {
      let {
         farewell_channel_id: farewellChannelId,
         farewell_message: farewellMessage,
      } = message.client.db.settings.selectFarewells.get(message.guild.id);
      const farewellChannel =
         message.guild.channels.cache.get(farewellChannelId);

      if (
         farewellChannel &&
         farewellChannel.viewable &&
         farewellChannel
            .permissionsFor(message.guild.me)
            .has(["SEND_MESSAGES", "EMBED_LINKS"]) &&
         farewellMessage
      ) {
         farewellMessage = farewellMessage
            .replace(/`?\?member`?/g, message.member) // Member mention substitution
            .replace(/`?\?username`?/g, message.member.user.username) // Username substitution
            .replace(/`?\?tag`?/g, message.member.user.tag) // Tag substitution
            .replace(/`?\?size`?/g, message.guild.memberCount); // Guild size substitution
         farewellChannel.send({
            embeds: [
               new MessageEmbed()
                  .setDescription(farewellMessage)
                  .setColor("RANDOM"),
            ],
         });
      } else {
         message.channel.send({
            embeds: [
               new MessageEmbed()
                  .setDescription(
                     `${emojis.fail} **There is no farewell message set for this server.**\n\n\`setfarewellmessage\` Sets a farewell message\n\`setfarewellchannel\` Sets the channel to post the farewell message to. `
                  )
                  .setColor("RED")
                  .setFooter({
                     text: message.member.displayName,
                     iconURL: message.author.displayAvatarURL({
                        dynamic: true,
                     }),
                  })
                  .setTimestamp(),
            ],
         });
      }
   }
};
