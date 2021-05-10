const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class thighsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'nsfw',
      aliases: ['18+'],
      usage: 'thighs <user mention/id>',
      description: 'Random nsfw image/gif',
      type: client.types.FUN,
      nsfwOnly: true,
      examples: ['nsfw boobs', 'nsfw thigh']
    });
  }
  async run(message, args) {
    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        var types = Array('hass', 'pgif', '4k', 'hentai', 'hneko', 'hkitsune', 'kemonomimi', 'anal', 'hanal', 'gonewild', 'ass', 'pussy', 'thigh', 'hthigh','paizuri', 'tentacle', 'boobs', 'hboobs');
        let chosen
        if (args[0])
        {
          if (types.includes(args[0])) chosen = types.find(e => e === args[0])
          else {
            const description = types.join('\n')
            return msg.edit(new MessageEmbed().setDescription(`${fail} Category **${args[0]}** Invalid!\n\n**Supported Categories:**\n${description}`))
          }
        }
        else chosen = types[Math.floor(Math.random() * types.length)];
        const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id); // Get prefix
        const buffer = await msg.client.nekoApi.get(chosen)
        await msg.edit(new MessageEmbed().setDescription(`Category: **${chosen}**`).setImage(buffer).setFooter(`Specify category like this, ${prefix}nsfw boobs`))
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
  }
};
