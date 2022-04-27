const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine, stripIndent } = require("common-tags");

module.exports = class clearCrownChannelCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearcrownchannel",
         aliases: ["clearcc", "ccc"],
         usage: "clearcrownchannel",
         description: oneLine`
        clears the crown message text channel for your server.
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearcrownchannel"],
      });
   }

   run(message, args) {
      let {
         crown_role_id: crownRoleId,
         crown_channel_id: crownChannelId,
         crown_message: crownMessage,
         crown_schedule: crownSchedule,
      } = message.client.db.settings.selectCrown.get(message.guild.id);
      const crownRole = message.guild.roles.cache.get(crownRoleId);
      const oldCrownChannel =
         message.guild.channels.cache.get(crownChannelId) || "`None`";

      // Trim message
      if (crownMessage && crownMessage.length > 1024)
         crownMessage = crownMessage.slice(0, 1021) + "...";

      const embed = new MessageEmbed()
         .setTitle("Settings: `Crown`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`crown channel\` was successfully cleared. ${success}`
         )
         .addField("Role", crownRole?.toString() || "`None`", true)
         .addField(
            "Schedule",
            `\`${crownSchedule ? crownSchedule : "None"}\``,
            true
         )
         .addField("Status", `\`disabled\``)
         // .addField('Message', message.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear channel
      message.client.db.settings.updateCrownChannelId.run(
         null,
         message.guild.id
      );
      return message.channel.send({
         embeds: [
            embed.spliceFields(1, 0, {
               name: "Channel",
               value: `${oldCrownChannel} ➔ \`None\``,
               inline: true,
            }),
         ],
      });
   }
};
