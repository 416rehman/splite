const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');

module.exports = class shipCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'ship',
      aliases: ['love'],
      usage: 'ship <user mention/id>',
      description: 'Generates a ship image',
      type: client.types.FUN,
      examples: ['ship @split']
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    message.guild.funInProgress.set(message.author.id, 'fun');
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;
    const member2 = await this.getMemberFromMention(message, args[1]) || await message.guild.members.cache.get(args[1]) || message.guild.members.cache.random();

    message.channel.send(new MessageEmbed().setDescription(`${load} Shipping...`)).then(async msg=>{
      try {
        let shipScore = this.getRandomInt(0, 100);
        if (message.guild.ships.has(message.author.id))
        {
          console.log('ship exists')
          const ships = message.guild.ships.get(message.author.id)
          const matchedBefore = ships.find( u=> u.userId = member2.id)
          shipScore = matchedBefore.shipScore;
        }
        else
        {
          console.log('adding to ships')
          message.guild.ships.set(message.author.id, new Set())
        }

        const progress = this.createProgressBar(shipScore)
        const b62 = await mergeImages([
          { src: './ship/bgt.png', x:0, y:0 },
          { src: this.getAvatarURL(member), x: 2, y: 25 },
          { src: this.getAvatarURL(member2), x: 607, y: 25 },
          shipScore < 50 ? './ship/bOverlay.png' : './ship/overlay.png'
        ], {
          Canvas: Canvas,
          Image: Image
        })
        const buff = new Buffer.from(b62.split(",")[1], "base64")
        await message.channel.send(new MessageEmbed()
            .setDescription(`\u200b\u200b\u200b\u200b\u200b\u200b\u200b\u200b\u200b**${shipScore}** ${progress} ${shipScore < 10 ? 'Yiiikes!' : shipScore < 20 ? 'Terrible 💩' : shipScore < 30 ? 'Very Bad 😭' : shipScore < 40 ? 'Bad 😓' : shipScore < 50 ? 'Worse Than Average 🤐' : shipScore < 60 ? 'Average 😔' : shipScore < 70 ? shipScore === 69 ? 'NICE 🙈' : 'Above Average ☺' : shipScore < 80 ? 'Pretty Good 😳' : shipScore < 90 ? 'Amazing 🤩' : shipScore < 100 ? 'Extraordinary 😍' : 'Perfect 🤩😍🥰'}`)
            .attachFiles(new MessageAttachment(buff, 'bg.png'))
            .setImage('attachment://bg.png'))
      }
      catch(e) {
        msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
      const ships = message.guild.ships.get(message.author.id)
      if (ships) ships.add({userId: member2.id, shipScore})
    })
    message.guild.funInProgress.delete(message.author.id)
  }
};
