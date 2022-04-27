const Command = require("../Command.js");
const { MessageButton } = require("discord.js");
const { MessageActionRow } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { oneLine } = require("common-tags");

module.exports = class SoftBanCommand extends Command {
   constructor(client) {
      super(client, {
         name: "softban",
         usage: "softban <user mention/ID> [reason]",
         description: oneLine`
        Softbans a member from your server (bans then immediately unbans).
        This wipes all messages from that member from your server.      
      `,
         type: client.types.MOD,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS"],
         userPermissions: ["BAN_MEMBERS"],
         examples: ["softban @split"],
      });
   }

   async run(message, args) {
      if (!args[0]) return this.sendHelpMessage(message);
      const member =
         (await this.getMemberFromMention(message, args[0])) ||
         (await message.guild.members.cache.get(args[0]));
      if (!member)
         return this.sendErrorMessage(
            message,
            0,
            "Please mention a user or provide a valid user ID"
         );
      if (member === message.member)
         return this.sendErrorMessage(
            message,
            0,
            "You cannot softban yourself"
         );
      if (
         member.roles.highest.position >= message.member.roles.highest.position
      )
         return this.sendErrorMessage(
            message,
            0,
            "You cannot softban someone with an equal or higher role"
         );
      if (!member.bannable)
         return this.sendErrorMessage(
            message,
            0,
            "Provided member is not bannable"
         );

      let reason = args.slice(1).join(" ");
      if (!reason) reason = "`None`";
      if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

      const row = new MessageActionRow();
      row.addComponents(
         new MessageButton()
            .setCustomId(`proceed`)
            .setLabel(`✅ Proceed`)
            .setStyle("SUCCESS")
      );
      row.addComponents(
         new MessageButton()
            .setCustomId(`cancel`)
            .setLabel(`❌ Cancel`)
            .setStyle("DANGER")
      );

      message.channel
         .send({
            embeds: [
               new MessageEmbed()
                  .setTitle("Softban Member")
                  .setDescription(`Do you want to softban ${member}?`)
                  .setFooter({ text: `Expires in 15s` }),
            ],
            components: [row],
         })
         .then(async (msg) => {
            const filter = (button) => button.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({
               filter,
               componentType: "BUTTON",
               time: 15000,
               dispose: true,
            });

            let updated = false;
            collector.on("collect", async (b) => {
               this.done(message.author.id);
               updated = true;
               if (b.customId === "proceed") {
                  await member.ban({ reason: reason });
                  await message.guild.members.unban(member.user, reason);

                  const embed = new MessageEmbed()
                     .setTitle("Softban Member")
                     .setDescription(`${member} was successfully softbanned.`)
                     .addField("Moderator", message.member.toString(), true)
                     .addField("Member", member.toString(), true)
                     .addField("Reason", reason)
                     .setFooter({
                        text: message.member.displayName,
                        iconURL: message.author.displayAvatarURL({
                           dynamic: true,
                        }),
                     })
                     .setTimestamp()
                     .setColor(message.guild.me.displayHexColor);
                  msg.edit({ embeds: [embed], components: [] });
                  message.client.logger.info(
                     `${message.guild.name}: ${message.author.tag} softbanned ${member.user.tag}`
                  );

                  // Update mod log
                  await this.sendModLogMessage(message, reason, {
                     Member: member,
                  });
               } else {
                  this.done(message.author.id);
                  msg.edit({
                     components: [],
                     embeds: [
                        new MessageEmbed()
                           .setTitle("Soft Ban Member")
                           .setDescription(
                              `${member} Not softbanned - Cancelled`
                           ),
                     ],
                  });
               }
            });

            collector.on("end", () => {
               this.done(message.author.id);
               if (updated) return;
               msg.edit({
                  components: [],
                  embeds: [
                     new MessageEmbed()
                        .setTitle("Soft Ban Member")
                        .setDescription(`${member} Not softbanned - Expired`),
                  ],
               });
            });
         });
   }
};
