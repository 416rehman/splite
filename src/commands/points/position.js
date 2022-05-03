const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { oneLine } = require("common-tags");
const emojis = require("../../utils/emojis.json");

module.exports = class PositionCommand extends Command {
   constructor(client) {
      super(client, {
         name: "position",
         aliases: ["pos"],
         usage: "position <user mention/ID>",
         description: oneLine`
        Fetches a user's current leaderboard position. 
        If no user is given, your own position will be displayed.
      `,
         type: client.types.POINTS,
         examples: ["position @split"],
      });
   }

   async run(message, args) {
      const member =
         (await this.getGuildMember(message.guild, args[0])) || message.member;
      const leaderboard = message.client.db.users.selectLeaderboard.all(
         message.guild.id
      );
      const pos = leaderboard.map((row) => row.user_id).indexOf(member.id) + 1;
      const ordinalPos = message.client.utils.getOrdinalNumeral(pos);
      const points = message.client.db.users.selectPoints
         .pluck()
         .get(member.id, message.guild.id);
      const embed = new MessageEmbed()
         .setTitle(`${member.displayName}'s Position`)
         .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
         .setDescription(`${member} is in **${ordinalPos}** place!`)
         .addField(
            "Position",
            `\`${pos}\` of \`${message.guild.memberCount}\``,
            true
         )
         .addField(`Points ${emojis.point}`, `\`${points}\``, true)
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(member.displayHexColor);
      message.channel.send({ embeds: [embed] });
   }
};
