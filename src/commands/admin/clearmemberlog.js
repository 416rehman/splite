const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class clearMemberLogCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearmemberlog",
         aliases: ["clearmeml", "cmeml"],
         usage: "clearmemberlog",
         description: oneLine`
        Clears the member join/leave log text channel for your server. 
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearmemberlog"],
      });
   }

   run(message) {
      const memberLogId = message.client.db.settings.selectMemberLogId
         .pluck()
         .get(message.guild.id);
      const oldMemberLog =
         message.guild.channels.cache.get(memberLogId) || "`None`";
      const embed = new MessageEmbed()
         .setTitle("Settings: `Logging`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`member log\` was successfully cleared. ${success}`
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear if no args provided
      message.client.db.settings.updateMemberLogId.run(null, message.guild.id);
      return message.channel.send({
         embeds: [embed.addField("Member Log", `${oldMemberLog} ➔ \`None\``)],
      });
   }
};
