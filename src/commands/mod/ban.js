const Command = require("../Command.js");
const { MessageActionRow } = require("discord.js");
const { MessageButton } = require("discord.js");
const { MessageEmbed } = require("discord.js");

module.exports = class BanCommand extends Command {
   constructor(client) {
      super(client, {
         name: "ban",
         usage: "ban <user mention/ID> [reason]",
         description: "Bans a member from your server.",
         type: client.types.MOD,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS"],
         userPermissions: ["BAN_MEMBERS"],
         examples: ["ban @split"],
         exclusive: true,
      });
   }

   async run(message, args) {
      if (!args[0]) {
         this.done(message.author.id);
         return this.sendHelpMessage(message);
      }
      const member =
         (await this.getMemberFromMention(message, args[0])) ||
         (await message.guild.members.cache.get(args[0]));
      if (!member) {
         this.done(message.author.id);
         return this.sendErrorMessage(
            message,
            0,
            "Please mention a user or provide a valid user ID"
         );
      }

      if (member === message.member) {
         this.done(message.author.id);
         return this.sendErrorMessage(message, 0, "You cannot ban yourself");
      }
      if (!member.bannable) {
         this.done(message.author.id);
         return this.sendErrorMessage(
            message,
            0,
            "Provided member is not bannable"
         );
      }

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
                  .setTitle("Ban Member")
                  .setDescription(`Do you want to ban ${member}?`)
                  .setFooter({
                     text: `Expires in 15 seconds`,
                     iconURL: message.author.displayAvatarURL(),
                  }),
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

                  const embed = new MessageEmbed()
                     .setTitle("Ban Member")
                     .setDescription(`${member} was successfully banned.`)
                     .addField("Moderator", message.member.toString(), true)
                     .addField("Member", member.toString(), true)
                     .addField("Reason", reason)
                     .setFooter({
                        text: message.member.displayName,
                        iconURL: message.author.displayAvatarURL(),
                     })
                     .setTimestamp()
                     .setColor(message.guild.me.displayHexColor);
                  msg.edit({ embeds: [embed], components: [] });
                  message.client.logger.info(
                     `${message.guild.name}: ${message.author.tag} banned ${member.user.tag}`
                  );
                  // Update mod log
                  this.sendModLogMessage(message, reason, { Member: member });
               } else {
                  msg.edit({
                     components: [],
                     embeds: [
                        new MessageEmbed()
                           .setTitle("Ban Member")
                           .setDescription(`${member} Not banned - Cancelled`),
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
                        .setTitle("Ban Member")
                        .setDescription(`${member} Not banned - Expired`),
                  ],
               });
            });
         });
   }
};
