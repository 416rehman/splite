const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const {fail, success} = require("../../utils/emojis.json")
const fetch = require('node-fetch');

module.exports = class BioCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'bio',
      aliases: [],
      usage: '`bio <message>` Set your bio\n`bio <@user>` Check out the mentioned user\'s bio\n`bio` View your bio\n`bio clear` Clear your bio',
      description: 'Set your bio or view others\'',
      type: client.types.FUN,
      examples: ['bio Splite is the best Discord Bot!']
    });
  }
  async run(message, args) {

    // Get message
    if (!args[0])
    {
      let {
        bio: Bio
      } = message.client.db.users.selectBio.get(message.guild.id, message.author.id);
      if (!Bio)
      {
        const embed = new MessageEmbed()
            .setTitle(`No Bio ${fail}`)
            .setDescription(`You don't have a bio set up.`)
            .setFooter(`Set your bio like "@splite bio This is my bio"`);
        return message.channel.send(embed)
      }
      else
      {
        const embed = new MessageEmbed()
            .setTitle(`${message.author.username}'s Bio`)
            .setDescription(`${Bio}`)
            .setFooter(`For help, type "@splite help bio"`);
        return message.channel.send(embed)
      }
    }
    else
    {
      if (args[0] === 'clear' && args.length === 1)
      {
        try {
          message.client.db.users.updateBio.run(null, message.author.id)

          const embed = new MessageEmbed()
              .setTitle(`Bio Cleared ${success}`)
              .setDescription(`Your bio has been cleared.\nTo set your bio again, type \`@splite bio <your bio here>\`.`)
              .setFooter(`Clear your bio by typing, @splite bio clear`);
          return message.channel.send(embed)
        } catch (e) {
          console.log(e)
        }
      }
      else if (args[0].startsWith('<@!') && args.length === 1)
      {
        let userId = args[0].replace('<@!', '').replace('>','');
        let {
          bio: Bio
        } = message.client.db.users.selectBio.get(message.guild.id, userId);

        if (!Bio)
        {
          const embed = new MessageEmbed()
              .setTitle(`No Bio ${fail}`)
              .setDescription(`This user does not have a bio.`)
              .setFooter(`@splite help bio"`);
          return message.channel.send(embed)
        }
        else
        {
          const embed = new MessageEmbed()
              .setTitle(`${message.author.username}'s Bio`)
              .setDescription(`${Bio}`)
              .setFooter(`To clear your bio, type "@splite bio clear"`);
          return message.channel.send(embed)
        }
      }
      else
      {
        const biotext = args.join(' ')
        console.log(biotext)
        message.client.db.users.updateBio.run(biotext, message.author.id)

        const embed = new MessageEmbed()
            .setTitle(`Bio Updated ${success}`)
            .setDescription(`Your bio has been updated. Check it out by typing \`@splite bio\`.`)
            .setFooter(`Clear your bio by typing, @splite bio clear`);
        return message.channel.send(embed)
      }
    }
  }
};
