const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const {fail, success} = require("../../utils/emojis.json")
const fetch = require('node-fetch');

module.exports = class BioCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'bio',
      usage: 'bio <message>',
      description: 'Set your bio\n`bio <@user>` Check out the mentioned user\'s bio\n`bio` View your bio\n`bio clear` Clear your bio',
      type: client.types.FUN,
      examples: [`bio ${client.name} is the best Discord Bot!`, `bio @${client.name}`, 'bio clear']
    });
  }
  async run(message, args) {

    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    // Show currrent bio of the author
    if (!args[0])
    {
      let {
        bio: Bio
      } = message.client.db.bios.selectBio.get(message.author.id);
      if (!Bio)
      {
        const embed = new MessageEmbed()
            .setTitle(`No Bio ${fail}`)
            .setDescription(`You don't have a bio set up.`)
            .setFooter(`Set your bio like "${prefix}bio split is cool"`);
        return message.channel.send({embeds: [embed]})
      }
      else
      {
        const embed = new MessageEmbed()
            .setTitle(`${message.author.username}'s Bio`)
            .setDescription(`${Bio}`)
            .setFooter(`For help, type "${prefix}help bio"`);
        return message.channel.send({embeds: [embed]})
      }
    }
    else
    { //Clear the bio
      if (args[0] === 'clear' && args.length === 1)
      {
        try {
          message.client.db.bios.updateBio.run(null, message.author.id)

          const embed = new MessageEmbed()
              .setTitle(`Bio Cleared ${success}`)
              .setDescription(`Your bio has been cleared.\nTo set your bio again, type \`@${message.client.name} bio <your bio here>\`.`)
              .setFooter(`Clear your bio by typing, ${prefix}bio clear`);
          return message.channel.send({embeds: [embed]})
        } catch (e) {
          console.log(e)
        }
      }

      else if ( args.length === 1 && args[0].startsWith('<@') && args[0].endsWith('>'))
      {
        let userId = args[0].replace('<@', '').replace('!', '').replace('>','');
        let {
          bio: Bio
        } = message.client.db.bios.selectBio.get(userId);

        if (!Bio)
        {
          const embed = new MessageEmbed()
              .setTitle(`No Bio ${fail}`)
              .setDescription(`This user does not have a bio.`)
              .setFooter(`For help, type "${prefix}help bio"`);
          return message.channel.send({embeds: [embed]})
        }
        else
        {
          const embed = new MessageEmbed()
              .setTitle(`${message.mentions.users.first().username}'s Bio`)
              .setDescription(`${Bio}`)
              .setFooter(`To clear your bio, type "${prefix}bio clear"`);
          return message.channel.send({embeds: [embed]})
        }
      }
      else
      {
        const biotext = args.join(' ')

        message.client.db.bios.updateBio.run(biotext, message.author.id)

        const embed = new MessageEmbed()
            .setTitle(`Bio Updated ${success}`)
            .setDescription(`Your bio has been updated. Check it out by typing \`${prefix}bio\`.`)
            .setFooter(`Clear your bio by typing, ${prefix}bio clear`);
        return message.channel.send({embeds: [embed]})
      }
    }
  }
};
