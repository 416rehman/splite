const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class clearWelcomeMessageCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearwelcomemessage",
         aliases: [
            "clearwelcomemsg",
            "clearwm",
            "cwm",
            "cleargreetmessage",
            "cleargreetmsg",
         ],
         usage: "clearwelcomemessage <message>",
         description: oneLine`
        Clears the message ${client.name} will say when someone joins your server.
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["clearwelcomemessage"],
      });
   }

   run(message, args) {
      const {
         welcome_channel_id: welcomeChannelId,
         welcome_message: oldWelcomeMessage,
      } = message.client.db.settings.selectWelcomes.get(message.guild.id);
      let welcomeChannel = message.guild.channels.cache.get(welcomeChannelId);

      // Get status
      const oldStatus = message.client.utils.getStatus(
         welcomeChannelId,
         oldWelcomeMessage
      );

      const embed = new MessageEmbed()
         .setTitle("Settings: `Welcomes`")
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setDescription(
            `The \`welcome message\` was successfully cleared. ${success}`
         )
         .addField("Channel", welcomeChannel?.toString() || "`None`", true)
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      message.client.db.settings.updateWelcomeMessage.run(
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
               .addField("Status", statusUpdate, true)
               .addField("Message", "`None`"),
         ],
      });
   }
};
