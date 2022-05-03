const Command = require("../Command.js");
const Discord = require("discord.js");

module.exports = class enlargeCommand extends Command {
   constructor(client) {
      super(client, {
         name: "enlarge",
         aliases: [
            "en",
            "el",
            "big",
            "maximize",
            "bigemoji",
            "enemoji",
            "expand",
            "enhance",
         ],
         usage: "en <emoji>",
         description: "Enlarges a custom emoji",
         type: client.types.FUN,
         clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
         examples: ["enlarge 🙄"],
      });
   }

   run(message, args) {
      if (!args[0]) return this.sendHelpMessage(message, "Enlarge Emoji");
      let customemoji = Discord.Util.parseEmoji(args[0]); //Check if it's a emoji

      if (customemoji.id) {
         const Link = `https://cdn.discordapp.com/emojis/${customemoji.id}.${
            customemoji.animated ? "gif" : "png"
         }`;
         return message.channel.send({
            files: [new Discord.MessageAttachment(Link)],
         });
      } else {
         this.sendErrorMessage(
            message,
            0,
            "Please mention a valid custom emoji."
         );
      }
   }
};
