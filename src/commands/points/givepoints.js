const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { stripIndent } = require("common-tags");
const emojis = require("../../utils/emojis.json");

module.exports = class GivePointsCommand extends Command {
   constructor(client) {
      super(client, {
         name: "givepoints",
         aliases: ["gp", "give", "send"],
         usage: "givepoints <user mention/ID> <point count>",
         description:
            "Gives the specified amount of your own points to the mentioned user.",
         type: client.types.POINTS,
         examples: ["givepoints @split 1000"],
      });
   }

   run(message, args) {
      const member =
         this.getMemberFromMention(message, args[0]) ||
         message.guild.members.cache.get(args[0]);
      if (!member)
         return this.sendErrorMessage(
            message,
            0,
            `Please mention a user or provide a valid user ID`
         );
      if (member.id === message.client.user.id)
         return message.channel.send(
            `${emojis.fail} Thank you, you\'re too kind! But I must decline. I prefer not to take handouts.`
         );
      const amount = parseInt(args[1]);
      const points = message.client.db.users.selectPoints
         .pluck()
         .get(message.author.id, message.guild.id);
      if (isNaN(amount) === true || !amount)
         return this.sendErrorMessage(
            message,
            0,
            `Please provide a valid point count`
         );
      if (amount < 0 || amount > points)
         return this.sendErrorMessage(
            message,
            0,
            stripIndent`
      Please provide a point count less than or equal to ${points} (your total points)
    `
         );
      // Remove points
      message.client.db.users.updatePoints.run(
         { points: -amount },
         message.author.id,
         message.guild.id
      );
      // Add points
      const oldPoints = message.client.db.users.selectPoints
         .pluck()
         .get(member.id, message.guild.id);
      message.client.db.users.updatePoints.run(
         { points: amount },
         member.id,
         message.guild.id
      );
      let description;
      if (amount === 1)
         description = `${emojis.success} Successfully transferred **${amount}** points ${emojis.point} to ${member}!`;
      else
         description = `${emojis.success} Successfully transferred **${amount}** points ${emojis.point} to ${member}!`;
      const embed = new MessageEmbed()
         .setTitle(`${member.displayName}'s Points ${emojis.point}`)
         .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
         .setDescription(description)
         .addField("From", message.member.toString(), true)
         .addField("To", member.toString(), true)
         .addField(
            "Points",
            `\`${oldPoints}\` ➔ \`${amount + oldPoints}\``,
            true
         )
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(member.displayHexColor);
      message.channel.send({ embeds: [embed] });
   }
};
