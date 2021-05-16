const Command = require('../Command.js');
const ReactionMenu = require('../ReactionMenu.js');
const { MessageEmbed } = require('discord.js');

module.exports = class ServersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'channels',
      aliases: ['chan'],
      usage: 'channels serverID',
      description: 'Displays a list of channels in a server.',
      type: client.types.OWNER,
      ownerOnly: true
    });
  }
  run(message, args) {
    const server = message.client.guilds.cache.get(args[0]) || message.guild
    const embed = new MessageEmbed()
      .setTitle('Channel List of ' + server.name)
      .setFooter(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    const channels = server.channels.cache.filter(ch=>ch.isText()).map(ch=>{return `${ch.name} \`${ch.id}\``})

    if (channels.length <= 10) {
      const range = (channels.length == 1) ? '[1]' : `[1 - ${channels.length}]`;
      message.channel.send(embed.setTitle(`Channel List ${range}`).setDescription(channels.join('\n')));
    } else {
      new ReactionMenu(message.client, message.channel, message.member, embed, channels);
    }
  }
};
