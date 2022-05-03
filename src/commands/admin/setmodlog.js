const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine, stripIndent } = require("common-tags");

module.exports = class SetModLogCommand extends Command {
   constructor(client) {
      super(client, {
         name: "setmodlog",
         aliases: ["setml", "sml"],
         usage: "setmodlog <channel mention/ID>",
         description: oneLine`
        Sets the mod log text channel for your server. 
        \nUse \`clearmodlog\` to clear the current \`mod log\`.
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["setmodlog #mod-log", "clearmodlog"],
      });
   }

   run(message, args) {
      const modLogId = message.client.db.settings.selectModLogId
         .pluck()
         .get(message.guild.id);
      const oldModLog = message.guild.channels.cache.get(modLogId) || "`None`";
      const embed = new MessageEmbed()
         .setTitle("Settings: `Logging`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))

         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      // Clear if no args provided
      if (args.length === 0) {
         return message.channel.send({
            embeds: [
               embed
                  .addField("Current Mod Log", `${oldModLog}` || "`None`")
                  .setDescription(this.description),
            ],
         });
      }
      embed.setDescription(
         `The \`mod log\` was successfully updated. ${success}\nUse \`clearmodlog\` to clear the current \`mod log\`.`
      );
      const modLog =
         this.getChannelFromMention(message, args[0]) ||
         message.guild.channels.cache.get(args[0]);
      if (!modLog || modLog.type != "GUILD_TEXT" || !modLog.viewable)
         return this.sendErrorMessage(
            message,
            0,
            stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `
         );
      message.client.db.settings.updateModLogId.run(
         modLog.id,
         message.guild.id
      );
      message.channel.send({
         embeds: [embed.addField("Mod Log", `${oldModLog} ➔ ${modLog}`)],
      });
   }
};
