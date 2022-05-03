const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class clearCrownRoleCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearcrownrole",
         aliases: ["clearcr", "ccr"],
         usage: "clearcrownrole",
         description: oneLine`
        Clears the role ${client.name} will give to the member with the most points each 24 hours.
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearcrownrole"],
      });
   }

   run(message) {
      let {
         crown_role_id: crownRoleId,
         crown_channel_id: crownChannelId,
         crown_message: crownMessage,
         crown_schedule: crownSchedule,
      } = message.client.db.settings.selectCrown.get(message.guild.id);
      const oldCrownRole =
         message.guild.roles.cache.get(crownRoleId) || "`None`";
      const crownChannel = message.guild.channels.cache.get(crownChannelId);

      // Get status
      const oldStatus = message.client.utils.getStatus(
         crownRoleId,
         crownSchedule
      );

      // Trim message
      if (crownMessage && crownMessage.length > 1024)
         crownMessage = crownMessage.slice(0, 1021) + "...";

      const embed = new MessageEmbed()
         .setTitle("Settings: `Crown`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`crown role\` was successfully cleared. ${success}`
         )
         .addField("Channel", crownChannel || "`None`", true)
         .addField(
            "Schedule",
            `\`${crownSchedule ? crownSchedule : "None"}\``,
            true
         )
         .addField(
            "Message",
            message.client.utils.replaceCrownKeywords(crownMessage) || "`None`"
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear role
      message.client.db.settings.updateCrownRoleId.run(null, message.guild.id);
      if (message.guild.job) message.guild.job.cancel(); // Cancel old job

      message.client.logger.info(`${message.guild.name}: Cancelled job`);

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
                  value: `${oldCrownRole} ➔ \`None\``,
                  inline: true,
               })
               .spliceFields(3, 0, { name: "Status", value: statusUpdate }),
         ],
      });
   }
};
