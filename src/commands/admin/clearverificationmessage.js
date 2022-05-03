const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class clearVerificationMessageCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearverificationmessage",
         aliases: ["clearverificationmsg", "clearvm", "cvm"],
         usage: "clearverificationmessage",
         description: oneLine`
        Clears the \`verification message\` used in \`verification channel\`.
      `,
         type: client.types.ADMIN,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"],
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearverificationmessage"],
      });
   }

   run(message) {
      let {
         verification_role_id: verificationRoleId,
         verification_channel_id: verificationChannelId,
         verification_message: oldVerificationMessage,
         verification_message_id: verificationMessageId,
      } = message.client.db.settings.selectVerification.get(message.guild.id);
      message.guild.roles.cache.get(verificationRoleId);
      message.guild.channels.cache.get(verificationChannelId);

      // Get status
      const oldStatus = message.client.utils.getStatus(
         verificationRoleId && verificationChannelId && oldVerificationMessage
      );

      const embed = new MessageEmbed()
         .setTitle("Settings: `Verification`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`verification message\` was successfully cleared. ${success}`
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      message.client.db.settings.updateVerificationMessage.run(
         null,
         message.guild.id
      );
      message.client.db.settings.updateVerificationMessageId.run(
         null,
         message.guild.id
      );

      // Clear if no args provided
      const status = "disabled";
      const statusUpdate =
         oldStatus != status
            ? `\`${oldStatus}\` ➔ \`${status}\``
            : `\`${oldStatus}\``;

      message.channel.send({
         embeds: [
            embed
               .addField(
                  "Verification Message ID",
                  `${verificationMessageId} ➔ \`None\``
               )
               .addField(
                  "Verification Message",
                  `${oldVerificationMessage} ➔ \`None\``
               )
               .addField("Status", `\`${statusUpdate}\``),
         ],
      });
   }
};
