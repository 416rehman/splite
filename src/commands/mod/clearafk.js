const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");

module.exports = class clearafkCommand extends Command {
   constructor(client) {
      super(client, {
         name: "clearafk",
         usage: "clearafk",
         description: "",
         type: client.types.INFO,
         examples: ["clearafk"],
         clientPermissions: [],
         userPermissions: ["KICK_MEMBERS"],
      });
   }

   async run(message, args) {
      const member = await this.getGuildMember(message.guild, args.join(" "));
      if (!member.id)
         return message.reply(
            "Please provide a valid member to clear their afk status."
         );

      message.client.db.users.updateAfk.run(
         null,
         0,
         message.author.id,
         message.guild.id
      );
      if (message.member.nickname)
         message.member
            .setNickname(`${message.member.nickname.replace("[AFK]", "")}`)
            .catch(() => {});

      const embed = new MessageEmbed()
         .setTitle("Clear AFK")
         .setDescription(`${member}'s AFK status was successfully cleared.`)
         .addField("Moderator", message.member.toString(), true)
         .addField("Member", member.toString(), true)
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);

      message.channel.send({ embeds: [embed] });
      this.sendModLogMessage(message, null, { Member: member.toString() });
   }
};
