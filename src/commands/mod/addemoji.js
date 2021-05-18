const Command = require('../Command.js');
const Discord = require("discord.js");
const { parse } = require("twemoji-parser");

module.exports = class AddRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'addemoji',
      aliases: ['em', 'emoji', 'emojiadd'],
      usage: 'addemoji <emoji> <name>',
      description: 'Add any of your preferred emoji from any server',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_EMOJIS'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['addemoji <:peperip:797063171789160458>']
    });
  }
  async run(message, args){
    try {
      let name;
      const urlRegex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/)

      if (args.length > 2)
      {
        args.forEach(emoji => {
          addEmoji(emoji)
        })
      }
      else addEmoji(args[0], args.slice(1).join("_"))

    } catch (err) {
      this.client.logger.error(err)
      this.sendErrorMessage(message, 1, 'A error occured while adding the emoji. Common reasons are:- unallowed characters in emoji name, 50 emoji limit.', err)
    }
  }
}

async function addEmoji(emoji, emojiName)
{
  if (!emoji) this.sendErrorMessage(message, 0, 'Please mention a valid emoji.');
  let name
  let customemoji = Discord.Util.parseEmoji(emoji) //Check if it's a emoji

  if (customemoji.id) {
    const Link = `https://cdn.discordapp.com/emojis/${customemoji.id}.${
        customemoji.animated ? "gif" : "png"
    }`
    name = emojiName
    const emoji = await message.guild.emojis.create(
        `${Link}`,
        `${name || `${customemoji.name}`}`
    );
    return message.channel.send(`${emoji} added with name "${customemoji.name}"`);
  } else if (urlRegex.test(emoji)) { //check for image urls
    name = emojiName || Math.random().toString(36).slice(2) //make the name compatible or just choose a random string
    const addedEmoji = await message.guild.emojis.create(
        `${emoji}`,
        `${name || `${customemoji.name}`}`
    );
    return message.channel.send(`${addedEmoji} added with name "${addedEmoji.name}"`);
  }
  else {
      let CheckEmoji = parse(emoji, { assetType: "png" });
      if (!CheckEmoji[0])
        return this.sendErrorMessage(message, 0, 'Please mention a valid emoji.');
    }
}