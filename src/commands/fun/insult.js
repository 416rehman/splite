const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");

module.exports = class insultCommand extends Command {
   constructor(client) {
      super(client, {
         name: "insult",
         aliases: ["roast"],
         usage: "insult",
         description: "Insult/roast someone",
         type: client.types.FUN,
         examples: ["insult @split"],
      });
   }

   async run(message, args) {
      const member =
         (await this.getGuildMember(message.guild, args.join(" "))) ||
         message.author;
      try {
         const res = await fetch(
            "https://evilinsult.com/generate_insult.php?lang=en&type=json"
         );
         const insult = (await res.json()).insult;

         const embed = new MessageEmbed()
            .setDescription(`<@${member.id}>, ${insult}`)
            .setFooter({
               text: message.member.displayName,
               iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
         message.channel.send({ embeds: [embed] });
      } catch (err) {
         message.client.logger.error(err.stack);
         this.sendErrorMessage(
            message,
            1,
            "Please try again in a few seconds",
            err.message
         );
      }
   }
};
