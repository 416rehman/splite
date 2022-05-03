const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");

module.exports = class clearMuteRoleCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearmuterole",
         aliases: ["clearmur", "cmur"],
         usage: "clearmuterole",
         description: "Clears the `mute role` your server.",
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["Clearmuterole"],
      });
   }

   run(message) {
      const muteRoleId = message.client.db.settings.selectMuteRoleId
         .pluck()
         .get(message.guild.id);
      const oldMuteRole =
         message.guild.roles.cache.find((r) => r.id === muteRoleId) || "`None`";

      const embed = new MessageEmbed()
         .setTitle("Settings: `System`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`mute role\` was successfully cleared. ${success}`
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear if no args provided
      message.client.db.settings.updateMuteRoleId.run(null, message.guild.id);
      return message.channel.send({
         embeds: [embed.addField("Mute Role", `${oldMuteRole} ➔ \`None\``)],
      });
   }
};
