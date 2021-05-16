const Command = require('../Command.js');
const ReactionMenu = require('../ReactionMenu.js');
const { MessageEmbed } = require('discord.js');

module.exports = class ServersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'history',
      aliases: ['hist', 'msgs'],
      usage: 'history <serverId> <channelId>',
      description: 'Displays history of channel.',
      type: client.types.OWNER,
      ownerOnly: true
    });
  }
  async run(message, args) {

    const target = message.client.channels.cache.get(args[0]) || message.client.guilds.cache.get(args[0]) || null
    if (!target) await message.reply(`Failed to resolve ID to a channel or guild`)
    if (target.constructor.name === 'TextChannel')
    {
      target.messages.fetch({ limit: 100 })
          .then(async msgs => {
            const history = msgs.filter(m=>!m.author.bot).array().map(msg=>{
              return `${msg.author.tag}\n${msg.content.length > 0 ? `\`\`\`${msg.content}\`\`\`` : ''}${ msg.attachments ? msg.attachments.array().map(att=>{return att.url}).join('\n'):'no attachments'}\n--------------------------------`
            })
            const embed = new MessageEmbed()
                .setTitle('Channel History of ' + target.name)
                .setFooter(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);

            if (history.length <= 10) {
              const range = (history.length == 1) ? '[1]' : `[1 - ${history.length}]`;
              await message.channel.send(embed.setTitle(`History ${range}`).setDescription(history.join('\n')));
            } else {
              new ReactionMenu(message.client, message.channel, message.member, embed, history);
            }
          })
    }
    else if (target.constructor.name === 'Guild')
    {
      getMessagesFromAllChannelsInServer(target, message).then(async history =>{
        const embed = new MessageEmbed()
            .setTitle('Server History of ' + target.name)
            .setFooter(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        console.log('done')
        if (history.length <= 10) {
          const range = (history.length == 1) ? '[1]' : `[1 - ${history.length}]`;
          await message.channel.send(embed.setTitle(`History ${range}`).setDescription(history.join('\n')));
        } else {
          new ReactionMenu(message.client, message.channel, message.member, embed, history);
        }
      })
    }
  }
};

async function getMessagesFromAllChannelsInServer (guild, message) {
  return new Promise(( async (resolve, reject) => {
    let history = [];
    for (ch of guild.channels.cache) {
      if (ch.isText() && ch.viewable)
      {
        const channel = message.client.channels.cache.get(ch.id)
        await channel.messages.fetch({ limit: 100 }).then(async msgs => {
          const temp = await msgs.filter(m=>!m.author.bot).array().map(msg=>{
            return `${msg.author.tag} - ${ch.name}\n${msg.content.length > 0 ? `\`\`\`${msg.content}\`\`\`` : ''}${ msg.attachments ? msg.attachments.array().map(att=>{return att.url}).join('\n'):'no attachments'}\n--------------------------------`
          })
        })
        history = history.concat(temp)
      }
    }
    if (history.length > 0) resolve(history)
    else reject('Empty History')
  }))
}
