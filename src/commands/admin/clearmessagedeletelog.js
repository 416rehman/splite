const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class clearMessageDeleteLogCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearmessagedeletelog",
         aliases: ["clearmsgdeletelog", "clearmdl", "cmdl"],
         usage: "clearmessagedeletelog",
         description: oneLine`
        Clears the message delete log text channel for your server. 
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearmessagedeletelog"],
      });
   }

   run(message) {
      const messageDeleteLogId =
         message.client.db.settings.selectMessageDeleteLogId
            .pluck()
            .get(message.guild.id);
      const oldMessageDeleteLog =
         message.guild.channels.cache.get(messageDeleteLogId) || "`None`";
      const embed = new MessageEmbed()
         .setTitle("Settings: `Logging`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`message delete log\` was successfully cleared. ${success}`
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear if no args provided
      message.client.db.settings.updateMessageDeleteLogId.run(
         null,
         message.guild.id
      );
      return message.channel.send({
         embeds: [
            embed.addField(
               "Message Delete Log",
               `${oldMessageDeleteLog} ➔ \`None\``
            ),
         ],
      });
   }
};
