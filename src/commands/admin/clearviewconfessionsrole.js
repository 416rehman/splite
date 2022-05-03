const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class clearViewConfessionsRoleCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearviewconfessionsrole",
         aliases: [
            "clearvcr",
            "cvcr",
            "clearviewconfessionrole",
            "clearviewconfession",
            "clearviewconfessions",
         ],
         usage: "clearviewconfessionsrole",
         description: oneLine`
        Clears the role whose members can use /view command to view details about a confession.
      `,
         type: client.types.ADMIN,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"],
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearviewconfessionsrole"],
      });
   }

   run(message) {
      const view_confessions_role =
         message.client.db.settings.selectViewConfessionsRole
            .pluck()
            .get(message.guild.id);
      const oldViewConfessionsRole =
         message.guild.roles.cache.get(view_confessions_role) || "`None`";

      // Get status
      const oldStatus = message.client.utils.getStatus(oldViewConfessionsRole);

      const embed = new MessageEmbed()
         .setTitle("Settings: `Confessions`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`view confessions role\` was successfully cleared. ${success}`
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear role
      message.client.db.settings.updateViewConfessionsRole.run(
         null,
         message.guild.id
      );

      // Update status
      const status = "disabled";
      const statusUpdate =
         oldStatus != status
            ? `\`${oldStatus}\` ➔ \`${status}\``
            : `\`${oldStatus}\``;

      return message.channel.send({
         embeds: [
            embed
               .spliceFields(0, 0, {
                  name: "Role",
                  value: `${oldViewConfessionsRole} ➔ \`None\``,
                  inline: true,
               })
               .spliceFields(2, 0, {
                  name: "Status",
                  value: statusUpdate,
                  inline: true,
               }),
         ],
      });
   }
};
