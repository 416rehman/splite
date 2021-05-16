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
    const target = await message.client.channels.cache.get(args[0]) || await message.client.guilds.cache.get(args[0]) || null;

    if (!target) await message.reply(`Failed to find a channel/server with provided ID`);
    let history = [];
    console.log(target.constructor.name)
    if (target.constructor.name === 'TextChannel') history = await this.getMessagesFromChannel(target);
    else if (target.constructor.name === 'Guild')
    {
        for (ch of target.channels.cache)
        {
            const temp = await this.getMessagesFromChannel(ch)
            history.concat(temp)
        }
    }
    const embed = new MessageEmbed()
      .setTitle('History of ' + message.client.channels.cache.get(args[0]).name)
      .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    if (history.length <= 10) {
      const range = (history.length == 1) ? '[1]' : `[1 - ${history.length}]`;
      await message.channel.send(embed.setTitle(`History ${range}`).setDescription(history.join('\n')));
    } else {
      new ReactionMenu(message.client, message.channel, message.member, embed, history);
    }
  }

    getMessagesFromChannel(channel) {
        channel.messages.fetch({limit: 100})
            .then(async msgs => {
                const history = msgs.filter(m => !m.author.bot).array().map(msg => {
                    return `${msg.author.tag}\n${msg.content.length > 0 ? `\`\`\`${msg.content}\`\`\`` : ''}${msg.attachments ? msg.attachments.array().map(att => {
                        return att.url
                    }).join('\n') : 'no attachments'}\n--------------------------------`
                })
                return history;
            })
    }
};
