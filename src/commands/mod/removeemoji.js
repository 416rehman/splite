const Command = require('../Command.js');
const Discord = require("discord.js");
const _emojis = require('../../utils/emojis.json')

module.exports = class RemoveEmojiCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'removeemoji',
      aliases: ['remove', 'rem', 'deleteemoji', 'dem', 'remoji'],
      usage: 'removeemoji <emoji>',
      description: "Delete emojis from the server.",
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_EMOJIS'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['removeemoji 🙄', 'rem 😂 😙 😎']
    });
  }
  async run(message, args){
    if (!args[0]) return this.sendHelpMessage(message, `Remove Emoji`);
    try {
        args.forEach(emoji => {
          removeemoji(emoji, message, this)
        })

    } catch (err) {
      this.client.logger.error(err)
      this.sendErrorMessage(message, 1, 'An error occured while removing the emoji. Common reasons are:- Deleting an emoji that is not from this server.', err)
    }
  }
}

async function removeemoji(emoji, message, command)
{
  if (!emoji) command.sendErrorMessage(message, 0, 'Please mention a valid emoji.');
  let customemoji = Discord.Util.parseEmoji(emoji) //Check if it's a emoji
  customemoji = await message.guild.emojis.cache.find(e => e.id === customemoji.id)

  if (customemoji.id) {
      customemoji.delete().then(()=>{
        message.channel.send(new Discord.MessageEmbed().setDescription(`${_emojis.success} ${emoji} Removed!`));
      })

      await command.sendModLogMessage(message, '', {Member: message.member, 'Removed Emoji': `\`${emoji}\``});
  }
  else return command.sendErrorMessage(message, 0, `Please mention a custom emoji from THIS server. ${emoji} is invalid`);
}
