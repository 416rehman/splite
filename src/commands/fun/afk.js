const Command = require('../Command.js');
const {idle} = require("../../utils/emojis.json")

module.exports = class AfkCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'afk',

      usage: 'afk <message>',
      description: 'Set your afk status. While you are afk, everytime you get pinged, the user will see your afk status',
      type: client.types.FUN,
      examples: [`afk Checking out ${client.name}!`]
    });
  }
  async run(message, args) {
    try {
    var d = new Date();
    //await message.member.setNickname(`[AFK]${message.member.nickname}`)
    // Get message
    if (!args[0])
    {
      message.client.db.users.updateAfk.run("", message.author.id, message.guild.id)
      message.client.db.users.updateAfkTime.run(d.valueOf(), message.author.id, message.guild.id)
      message.guild.members.cache.get(message.author.id).setNickname(`[AFK]${message.member.nickname ? message.member.nickname : message.member.displayName}`).catch(err=>console.log())
      return message.channel.send(`${idle} ${message.author} You have gone afk!`)
    }
    else {
      message.client.db.users.updateAfk.run(args.join(' '), message.author.id, message.guild.id)
      message.client.db.users.updateAfkTime.run(d.valueOf(), message.author.id, message.guild.id )
      message.guild.members.cache.get(message.author.id).setNickname(`[AFK]${message.member.nickname ? message.member.nickname : message.member.displayName}`).catch(err=>console.log())
      return message.channel.send(`${idle} ${message.author} You have gone afk: ${args.join(' ')}`)
    }
  }
  catch (err) {
    return this.sendErrorMessage(message, 1, 'Failed to set your afk', err.message);
  }
  }
};
