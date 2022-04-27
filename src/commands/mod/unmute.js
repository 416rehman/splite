const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");

module.exports = class UnmuteCommand extends Command {
   constructor(client) {
      super(client, {
         name: "unmute",
         aliases: ["ungulag"],
         usage: "unmute <user mention/ID>",
         description: "Unmutes the specified user.",
         type: client.types.MOD,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
         userPermissions: ["MANAGE_ROLES"],
         examples: ["unmute @split"],
      });
   }

   async run(message, args) {
      if (!args[0]) return this.sendHelpMessage(message);
      const muteRoleId = message.client.db.settings.selectMuteRoleId
         .pluck()
         .get(message.guild.id);
      let muteRole;
      if (muteRoleId) muteRole = message.guild.roles.cache.get(muteRoleId);
      else
         return this.sendErrorMessage(
            message,
            1,
            "There is currently no mute role set on this server"
         );

      const member =
         (await this.getMemberFromMention(message, args[0])) ||
         (await message.guild.members.cache.get(args[0]));
      if (!member)
         return this.sendErrorMessage(
            message,
            0,
            "Please mention a user or provide a valid user ID"
         );

      let reason = args.slice(2).join(" ");
      if (!reason) reason = "`None`";
      if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

      if (!member.roles.cache.has(muteRoleId))
         return this.sendErrorMessage(
            message,
            0,
            "Provided member is not muted"
         );

      // Unmute member
      clearTimeout(member.timeout);
      try {
         await member.roles.remove(muteRole);
         const embed = new MessageEmbed()
            .setTitle("Unmute Member")
            .setDescription(`${member} has been unmuted.`)
            .addField("Reason", reason)
            .setFooter({
               text: message.member.displayName,
               iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
         message.channel.send({ embeds: [embed] });
      } catch (err) {
         message.client.logger.error(err.stack);
         return this.sendErrorMessage(
            message,
            1,
            "Please check the role hierarchy",
            err.message
         );
      }

      // Update mod log
      this.sendModLogMessage(message, reason, { Member: member });
   }
};
