const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { stripIndent } = require("common-tags");
const emojis = require("../../utils/emojis.json");

module.exports = class MembersCommand extends Command {
   constructor(client) {
      super(client, {
         name: "members",
         aliases: ["mm", "mem", "mems", "member"],
         usage: "members <role mention/ID/name>",
         description:
            "Displays members with the specified role. If no role is specified, displays how many server members are online, busy, AFK, and offline.",
         type: client.types.MOD,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
         userPermissions: ["MANAGE_ROLES"],
         examples: [
            "members @bots",
            "members 711797614697250856",
            "members bots",
         ],
      });
   }

   async run(message, args) {
      if (!args.length > 0) {
         const members = [...message.guild.members.cache.values()];
         const online = members.filter(
            (m) => m.presence?.status === "online"
         ).length;
         const offline = members.filter(
            (m) => !m.presence || m.presence?.status === "offline"
         ).length;
         const dnd = members.filter((m) => m.presence?.status === "dnd").length;
         const afk = members.filter(
            (m) => m.presence?.status === "idle"
         ).length;
         const embed = new MessageEmbed()
            .setTitle(`Member Status [${message.guild.members.cache.size}]`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(
               stripIndent`
        ${emojis.online} **Online:** \`${online}\` members
        ${emojis.dnd} **Busy:** \`${dnd}\` members
        ${emojis.idle} **AFK:** \`${afk}\` members
        ${emojis.offline} **Offline:** \`${offline}\` members
      `
            )
            .setFooter({
               text: message.member.displayName,
               iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
         return message.channel.send({ embeds: [embed] });
      }

      let role;
      if (args[0].startsWith("<@&") || /^[0-9]{18}$/g.test(args[0]))
         role =
            this.getRoleFromMention(message, args[0]) ||
            message.guild.roles.cache.get(args[0]);
      else
         role = message.guild.roles.cache.find((r) =>
            r.name.toLowerCase().startsWith(args[0].toLowerCase())
         );

      if (!role)
         return this.sendErrorMessage(
            message,
            0,
            `Failed to find that role, try using a role ID`
         );
      let description = "";
      let i = 0;
      role.members.some((m) => {
         const user = `<@${m.user.id}> • `;
         if (description.length + user.length < 2048) {
            description += user;
            i++;
         } else return true;
      });

      const embed = new MessageEmbed()
         .setTitle(`Members of ${role.name}`)
         .setDescription(description)
         .setFooter({
            text: `${role.members.size} Members in ${role.name} | Showing ${i}`,
         });
      message.channel.send({ embeds: [embed] }).catch((err) => {
         return this.sendErrorMessage(
            message,
            0,
            `Too many members to display. Please try another role with fewer members`
         );
      });
   }
};
