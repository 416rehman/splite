const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');
const { confirm } = require("djs-reaction-collector")

module.exports = class toggleSmashOrPassCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'optout',
      aliases: ['tsmashorpass', 'tsmash', 'tsop', 'togglesmash', 'optoutsmash'],
      usage: 'togglesmashorpass',
      description: oneLine`
        Opt out/in of 🔥 Smash or Pass 👎. If you opt-out you will not be shown to other users in the game.
      `,
      type: client.types.SMASHORPASS,
      examples: ['togglesmashorpass']
    });
  }
  async run(message, args) {
    const currentStatus = message.client.db.users.selectOptOutSmashOrPass.pluck().get(message.author.id)

    if (currentStatus === 0) {
      const embed = new MessageEmbed()
          .setTitle(`Opt out of 🔥 Smash or Pass 👎`)
          .setDescription(`You are currently opted in 🔥 Smash or Pass 👎\nIf you opt out, you will not be shown in the game.\n**Do you wish to opt out?**`)
      message.channel.send({embeds: [embed]}).then(async msg => {
        const reactions = await confirm(msg, message.author, ["✅", "❎"], 10000);

        if (reactions === '✅')
        {
          await msg.client.db.users.updateOptOutSmashOrPass.run(1, message.author.id)
          msg.edit({embeds: [new MessageEmbed()
              .setTitle(`Opt out of 🔥 Smash or Pass 👎`)
              .setDescription(`**You have opted out of 🔥 Smash or Pass 👎**\nYou will not be shown in the game.`)]})
        }
        else
        {
          msg.delete();
        }
      })
    }
    else if (currentStatus === 1)
    {
      const embed = new MessageEmbed()
          .setTitle(`Opt in to 🔥 Smash or Pass 👎`)
          .setDescription(`You are currently opted out of 🔥 Smash or Pass 👎\nIf you opt in, you will be shown in the game.\n**Do you wish to opt in?**`)
      message.channel.send({embeds: [embed]}).then(async msg => {
        const reactions = await confirm(msg, message.author, ["✅", "❎"], 10000);

        if (reactions === '✅')
        {
          await msg.client.db.users.updateOptOutSmashOrPass.run(0, message.author.id)
          msg.edit({embeds: [new MessageEmbed()
              .setTitle(`Opt In to 🔥 Smash or Pass 👎`)
              .setDescription(`**You have opted in to 🔥 Smash or Pass 👎**\nYou will now be shown in the game.`)]})
        }
        else
        {
          msg.delete();
        }
      })
    }
  }
};
