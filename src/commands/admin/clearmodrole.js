const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");

module.exports = class clearModRoleCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearmodrole",
         aliases: ["clearmr", "cmr"],
         usage: "clearmodrole",
         description: "clears the `mod role` for your server.",
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearmodrole"],
      });
   }

   run(message) {
      const modRoleId = message.client.db.settings.selectModRoleId
         .pluck()
         .get(message.guild.id);
      const oldModRole =
         message.guild.roles.cache.find((r) => r.id === modRoleId) || "`None`";

      const embed = new MessageEmbed()
         .setTitle("Settings: `System`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`mod role\` was successfully cleared. ${success}`
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear if no args provided
      message.client.db.settings.updateModRoleId.run(null, message.guild.id);
      return message.channel.send({
         embeds: [embed.addField("Mod Role", `${oldModRole} ➔ \`None\``)],
      });
   }
};
