const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class thighsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'nsfw',
      aliases: ['nsfw'],
      usage: 'thighs <user mention/id>',
      description: 'Random nsfw image',
      type: client.types.FUN,
      nsfwOnly: true,
      examples: ['nsfw']
    });
  }
  async run(message, args) {
    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        var types = Array('hass', 'hmidriff', 'pgif', '4k', 'hentai', 'holo', 'hneko', 'neko', 'hkitsune', 'kemonomimi', 'anal', 'hanal', 'gonewild', 'kanna', 'ass', 'pussy', 'thigh', 'hthigh', 'gah','paizuri', 'tentacle', 'boobs', 'hboobs', 'yaoi');
        let chosen
        if (args[0])
        {
          if (types.includes(args[0])) chosen = types.find(e => e === args[0])
          else {
            const description = types.join('\n')
            return msg.edit(new MessageEmbed().setDescription(`${fail} Image Type **${args[0]}** Invalid!\nSupported Image Types:\n${description}`))
          }
        }
        else chosen = types[Math.floor(Math.random() * types.length)];

        const buffer = await msg.client.nekoApi.get(chosen)
        await msg.edit(new MessageEmbed().setDescription(`Image Type: ${chosen}`).setImage(buffer))
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
  }
};
