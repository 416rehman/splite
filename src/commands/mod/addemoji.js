const Command = require("../Command.js");
const Discord = require("discord.js");
const { parse } = require("twemoji-parser");
const _emojis = require("../../utils/emojis.json");

module.exports = class AddEmojiCommand extends Command {
   constructor(client) {
      super(client, {
         name: "addemoji",
         aliases: ["add", "em", "emoji", "emoji", "addemote", "ae"],
         usage: "addemoji <emoji> <name>",
         description:
            "Add emoji from a server, or an image link.\nMultiple emojis can be added by typing all of them at once seperated by spaces.",
         type: client.types.MOD,
         clientPermissions: [
            "SEND_MESSAGES",
            "EMBED_LINKS",
            "MANAGE_EMOJIS_AND_STICKERS",
         ],
         userPermissions: ["MANAGE_ROLES"],
         examples: [
            "addemoji 🙄 feelsbad",
            "em https://i.imgur.com/iYU1mgQ.png coolEmoji",
            "em 😂 😙 😎",
         ],
      });
   }

   run(message, args) {
      let emoji;
      if (!args[0]) return this.sendHelpMessage(message, "Add Emoji");
      try {
         if (args.length > 1) {
            const isSecondArgEmoji =
               /^(ftp|http|https):\/\/[^ "]+$/.test(args[1]) ||
               Discord.Util.parseEmoji(args[1]).id;
            if (isSecondArgEmoji) {
               args.forEach((emoji) => {
                  addEmoji(emoji, message, this);
               });
               return this.sendModLogMessage(message, null, {
                  Emoji: "Multiple Emojis",
               });
            } else
               emoji = addEmoji(
                  args[0],
                  message,
                  this,
                  args.slice(1).join("_")
               );
         } else
            emoji = addEmoji(args[0], message, this, args.slice(1).join("_"));
         this.sendModLogMessage(message, null, { Emoji: emoji });
      } catch (err) {
         this.client.logger.error(err);
         this.sendErrorMessage(
            message,
            1,
            "A error occured while adding the emoji. Common reasons are:- unallowed characters in emoji name, 50 emoji limit.",
            err
         );
      }
   }
};

async function addEmoji(emoji, message, command, emojiName) {
   const urlRegex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/);
   if (!emoji)
      command.sendErrorMessage(message, 0, "Please mention a valid emoji.");
   let name;
   let customemoji = Discord.Util.parseEmoji(emoji); //Check if it's a emoji
   console.log(emoji);
   if (customemoji.id) {
      const Link = `https://cdn.discordapp.com/emojis/${customemoji.id}.${
         customemoji.animated ? "gif" : "png"
      }`;
      name = emojiName || customemoji.name;
      const emoji = await message.guild.emojis.create(`${Link}`, `${name}`);
      message.channel.send({
         embeds: [
            new Discord.MessageEmbed().setDescription(
               `${_emojis.success} ${emoji} added with name "${name}"`
            ),
         ],
      });
      return emoji;
   } else if (urlRegex.test(emoji)) {
      //check for image urls
      name = emojiName || Math.random().toString(36).slice(2); //make the name compatible or just choose a random string
      try {
         const addedEmoji = await message.guild.emojis.create(
            `${emoji}`,
            `${name || `${customemoji.name}`}`
         );
         return message.channel.send({
            embeds: [
               new Discord.MessageEmbed()
                  .setDescription(
                     `${addedEmoji} added with name "${addedEmoji.name}"`
                  )
                  .setFooter({
                     text: message.member.displayName,
                     iconURL: message.author.displayAvatarURL(),
                  }),
            ],
         });
      } catch (e) {
         return message.channel.send({
            embeds: [
               new Discord.MessageEmbed()
                  .setDescription(
                     `${_emojis.fail} Failed to add emoji\n\`\`\`${e.message}\`\`\``
                  )
                  .setFooter({
                     text: message.member.displayName,
                     iconURL: message.author.displayAvatarURL(),
                  }),
            ],
         });
      }
   } else {
      let CheckEmoji = parse(emoji, { assetType: "png" });
      if (!CheckEmoji[0])
         return command.sendErrorMessage(
            message,
            0,
            `Please mention a valid emoji. ${emoji} is invalid`
         );
   }
}
