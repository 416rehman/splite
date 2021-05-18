const Command = require('../Command.js');
const Discord = require("discord.js");
const { parse } = require("twemoji-parser");

module.exports = class AddRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'addemoji',
      aliases: ['em', 'emoji', 'emojiadd'],
      usage: 'addemoji <emoji> <name>',
      description: 'Add any of your preferred emoji from any server, or an image link.\nMultiple emojis can be added by typing all of them at once (Emoji name cannot be set if adding multiple).',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_EMOJIS'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['addemoji 🙄 feelsbad', 'em https://i.imgur.com/iYU1mgQ.png coolEmoji', 'em 😂 😙 😎']
    });
  }
  async run(message, args){
    try {
      console.log(args)
      args = args.join('%^')
      args = args.replace('<' , ' <')
      args = args.split('%^')
      console.log(args)
      // if (args.length > 2)
      // {
      //   args.forEach(emoji => {
      //     addEmoji(emoji, message, this)
      //   })
      // }
      // else addEmoji(args[0], message, this, args.slice(1).join("_"))

    } catch (err) {
      this.client.logger.error(err)
      this.sendErrorMessage(message, 1, 'A error occured while adding the emoji. Common reasons are:- unallowed characters in emoji name, 50 emoji limit.', err)
    }
  }
}

async function addEmoji(emoji, message, command, emojiName)
{
  console.log(emojiName)
  const urlRegex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/)
  if (!emoji) command.sendErrorMessage(message, 0, 'Please mention a valid emoji.');
  let name
  let customemoji = Discord.Util.parseEmoji(emoji) //Check if it's a emoji

  if (customemoji.id) {
    const Link = `https://cdn.discordapp.com/emojis/${customemoji.id}.${
        customemoji.animated ? "gif" : "png"
    }`
    name = emojiName || customemoji.name;
    const emoji = await message.guild.emojis.create(
        `${Link}`,
        `${name}`
    );
    return message.channel.send(`${emoji} added with name "${name}"`);
  }
  else if (urlRegex.test(emoji)) { //check for image urls
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
      return command.sendErrorMessage(message, 0, 'Please mention a valid emoji.');
  }
}
